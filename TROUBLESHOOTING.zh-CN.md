# 故障排查指南

[English](TROUBLESHOOTING.md) | [Português](TROUBLESHOOTING.pt-BR.md) | **中文**

yus 插件的常见问题及解决方法。

## 目录

- [内存与上下文问题](#内存与上下文问题)
- [智能体环境故障](#智能体环境故障)
- [钩子与工作流错误](#钩子与工作流错误)
- [安装与配置](#安装与配置)
- [性能问题](#性能问题)
- [常见错误信息](#常见错误信息)
- [获取帮助](#获取帮助)

---

## 内存与上下文问题

### 上下文窗口溢出

**现象：**出现 "Context too long" 错误或回复不完整

**原因：**
- 上传的大文件超过 token 限制
- 对话历史不断累积
- 同一会话中有多个很大的工具输出

**解决方法：**
```bash
# 1. 清空对话历史，重新开始
# 在 Claude Code 中："New Chat" 或 Cmd/Ctrl+Shift+N

# 2. 分析前先缩小文件
head -n 100 large-file.log > sample.log

# 3. 大输出分段查看
head -n 50 large-file.txt

# 4. 把任务拆成更小的部分
# 不要说："分析全部 50 个文件"
# 改为："分析 src/components/ 目录下的文件"
```

### 记忆持久化失败

**现象：**智能体不记得之前的上下文或观察记录

**原因：**
- 持续学习钩子被禁用
- 观察文件损坏
- 项目检测失败

**解决方法：**
```bash
# 检查是否在记录观察
ls ~/.claude/homunculus/projects/*/observations.jsonl

# 找到当前项目的哈希 id
python3 - <<'PY'
import json, os
registry_path = os.path.expanduser("~/.claude/homunculus/projects.json")
with open(registry_path) as f:
    registry = json.load(f)
for project_id, meta in registry.items():
    if meta.get("root") == os.getcwd():
        print(project_id)
        break
else:
    raise SystemExit("Project hash not found in ~/.claude/homunculus/projects.json")
PY

# 查看该项目最近的观察记录
tail -20 ~/.claude/homunculus/projects/<project-hash>/observations.jsonl

# 重建之前先备份损坏的观察文件
mv ~/.claude/homunculus/projects/<project-hash>/observations.jsonl \
  ~/.claude/homunculus/projects/<project-hash>/observations.jsonl.bak.$(date +%Y%m%d-%H%M%S)

# 确认钩子已启用
grep -r "observe" ~/.claude/settings.json
```

---

## 智能体环境故障

### 找不到智能体

**现象：**出现 "Agent not loaded" 或 "Unknown agent" 错误

**原因：**
- 插件没有正确安装
- 智能体路径配置错误
- 插件市场安装与手动安装混用

**解决方法：**
```bash
# 检查插件安装
ls ~/.claude/plugins/cache/

# 确认智能体存在（插件市场安装）
ls ~/.claude/plugins/cache/*/agents/

# 手动安装时，智能体应位于：
ls ~/.claude/agents/  # 仅自定义智能体

# 重新加载插件
# Claude Code → Settings → Extensions → Reload
```

### 工作流执行卡住

**现象：**智能体启动后一直不结束

**原因：**
- 智能体逻辑中有死循环
- 在等待用户输入
- 等待 API 时网络超时

**解决方法：**
```bash
# 1. 查找卡住的进程
ps aux | grep claude

# 2. 开启调试模式
export CLAUDE_DEBUG=1

# 3. 设置更短的超时
export CLAUDE_TIMEOUT=30

# 4. 检查网络连通性
curl -I https://api.anthropic.com
```

### 工具调用错误

**现象：**"Tool execution failed" 或权限被拒绝

**原因：**
- 缺少依赖（npm、python 等）
- 文件权限不足
- 路径不存在

**解决方法：**
```bash
# 确认所需工具已安装
which node python3 npm git

# 修复钩子脚本的权限
chmod +x ~/.claude/plugins/cache/*/hooks/*.sh
chmod +x ~/.claude/plugins/cache/*/skills/*/hooks/*.sh

# 检查 PATH 是否包含所需的程序
echo $PATH
```

---

## 钩子与工作流错误

### 钩子没有触发

**现象：**前置/后置钩子没有执行

**原因：**
- 钩子没有在 settings.json 中注册
- 钩子语法错误
- 钩子脚本没有执行权限

**解决方法：**
```bash
# 检查钩子是否已注册
grep -A 10 '"hooks"' ~/.claude/settings.json

# 确认钩子文件存在且可执行
ls -la ~/.claude/plugins/cache/*/hooks/

# 手动测试钩子
bash ~/.claude/plugins/cache/*/hooks/pre-bash.sh <<< '{"command":"echo test"}'

# 重新注册钩子（使用插件时）
# 在 Claude Code 设置中先禁用再启用插件
```

### Python/Node 版本不匹配

**现象：**"python3 not found" 或 "node: command not found"

**原因：**
- 没有安装 Python/Node
- PATH 未配置
- Python 版本不对（Windows）

**解决方法：**
```bash
# 安装 Python 3（如果没有）
# macOS: brew install python3
# Ubuntu: sudo apt install python3
# Windows: 从 python.org 下载

# 安装 Node.js（如果没有）
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: 从 nodejs.org 下载

# 确认安装
python3 --version
node --version
npm --version

# Windows：确保 `python`（而不是 `python3`）可以运行
python --version
```

### 开发服务器拦截误报

**现象：**钩子拦截了提到 "dev" 的正常命令

**原因：**
- heredoc 内容触发了匹配规则
- 参数中带有 "dev" 的非开发命令

**解决方法：**
```bash
# 已在 v1.8.0+ 修复（PR #371）
# 把插件升级到最新版本

# 变通办法：在 tmux 中运行开发服务器
tmux new-session -d -s dev "npm run dev"
tmux attach -t dev

# 必要时临时禁用钩子
# 编辑 ~/.claude/settings.json，删除 pre-bash 钩子
```

---

## 安装与配置

### 插件无法加载

**现象：**安装后插件功能不可用

**原因：**
- 插件市场缓存没有更新
- Claude Code 版本不兼容
- 插件文件损坏
- 本地 Claude 配置被清除或重置

**解决方法：**
```bash
# 先看看 yus 对这台机器还记录了什么
yus list-installed
yus doctor
yus repair

# 只有 doctor/repair 无法恢复缺失文件时才重新安装

# 修改之前先检查插件缓存
ls -la ~/.claude/plugins/cache/

# 备份插件缓存，而不是直接删除
mv ~/.claude/plugins/cache ~/.claude/plugins/cache.backup.$(date +%Y%m%d-%H%M%S)
mkdir -p ~/.claude/plugins/cache

# 从插件市场重新安装
# Claude Code → Extensions → yus → Uninstall
# 然后从插件市场重新安装

# 如果是插件市场或账号访问问题，请单独通过 ECC Tools 恢复账号；重新安装不能代替账号恢复

# 检查 Claude Code 版本
claude --version
# 需要 Claude Code 2.0+

# 手动安装（插件市场失败时）
git clone https://github.com/yusei21/yus.git
cp -r yus ~/.claude/plugins/yus
```

### 包管理器检测失败

**现象：**用错了包管理器（用了 npm 而不是 pnpm）

**原因：**
- 没有锁文件
- 未设置 CLAUDE_PACKAGE_MANAGER
- 多个锁文件干扰检测

**解决方法：**
```bash
# 全局设置首选包管理器
export CLAUDE_PACKAGE_MANAGER=pnpm
# 加到 ~/.bashrc 或 ~/.zshrc

# 或按项目设置
echo '{"packageManager": "pnpm"}' > .claude/package-manager.json

# 或使用 package.json 字段
npm pkg set packageManager="pnpm@8.15.0"

# 警告：删除锁文件可能改变已安装依赖的版本。
# 先提交或备份锁文件，再全新安装并重新运行 CI。
# 只有在有意更换包管理器时才这样做。
rm package-lock.json  # 使用 pnpm/yarn/bun 时
```

### OpenCode 在 Termux/Android 上无法启动

**现象：**已修改文件跟踪悄悄停止工作（OpenCode 日志中出现一次
`[yus] changed-files tracking disabled` 警告），或者在旧版本中 `opencode` 启动时直接因
Bun 的 `ResolveMessage` 崩溃，例如：

```
ResolveMessage: Cannot find module '../plugins/lib/changed-files-store.js' from '.../.opencode/tools/changed-files.ts'
```

**原因：**
- 这台机器上的 `~/.opencode` 安装缺失或不完整——通常 `tools/` 和 `plugins/` 都在，但
  `plugins/lib/` 没有复制完（安装被中断，或存储/权限问题，在 Android 文件系统上更常见）。
  `changed-files` 工具和 `yus-hooks` 插件都依赖 `plugins/lib/changed-files-store.js`；由于
  `yus-hooks.ts` 是 OpenCode 的插件入口（在会话启动时、`tools/index.ts` 汇总文件之前加载一次），
  那里缺少依赖会让整个 OpenCode 会话在任何钩子加载前崩溃，而不只是那一个工具。

**解决方法：**
```bash
# 在 yus 仓库中检查并修复缺失/不完整的托管文件
yus doctor --target opencode
yus repair --target opencode

# 如果报告没有差异，但设备上 plugins/ 仍然缺失，
# 针对 opencode 目标重新运行 yus 安装器
```

**注意：**如果你还看到引用 `~/.config/opencode/oh-my-opencode-slim.json` 的
`ProviderModelNotFoundError: Model not found: openai/gpt-5.5`，那个文件属于第三方插件
[`oh-my-opencode-slim`](https://github.com/alvinunreal/oh-my-opencode-slim)，不是 yus——yus 从不
写入 `~/.config/opencode/`。请在那里修正模型前缀（用 `opencode/...` 而不是 `openai/...`），或向
那个项目报告。

---

## 性能问题

### 响应很慢

**现象：**智能体要 30 秒以上才回复

**原因：**
- 观察文件很大
- 启用的钩子太多
- 到 API 的网络延迟

**解决方法：**
```bash
# 归档大的观察文件，而不是删除
archive_dir="$HOME/.claude/homunculus/archive/$(date +%Y%m%d)"
mkdir -p "$archive_dir"
find ~/.claude/homunculus/projects -name "observations.jsonl" -size +10M -exec sh -c '
  for file do
    base=$(basename "$(dirname "$file")")
    gzip -c "$file" > "'"$archive_dir"'/${base}-observations.jsonl.gz"
    : > "$file"
  done
' sh {} +

# 临时禁用不用的钩子
# 编辑 ~/.claude/settings.json

# 保持当前观察文件较小
# 大的归档应放在 ~/.claude/homunculus/archive/
```

### CPU 占用高

**现象：**Claude Code 占用 100% CPU

**原因：**
- 观察陷入死循环
- 监视大目录中的文件
- 钩子内存泄漏

**解决方法：**
```bash
# 查找失控的进程
top -o cpu | grep claude

# 临时禁用持续学习
touch ~/.claude/homunculus/disabled

# 重启 Claude Code
# Cmd/Ctrl+Q 然后重新打开

# 检查观察文件大小
du -sh ~/.claude/homunculus/*/
```

---

## 常见错误信息

### "EACCES: permission denied"

```bash
# 修复钩子权限
find ~/.claude/plugins -name "*.sh" -exec chmod +x {} \;

# 修复观察目录权限
chmod -R u+rwX,go+rX ~/.claude/homunculus
```

### "MODULE_NOT_FOUND"

```bash
# 安装插件依赖
# 把 <version> 换成 `claude plugin list` 中显示的版本，例如 2.2.3
cd "$HOME/.claude/plugins/cache/yus/yus/<version>"
npm install

# 或者手动安装时
cd ~/.claude/plugins/yus
npm install
```

### "spawn UNKNOWN"

```bash
# Windows 专属：确保脚本使用正确的换行符
# 把 CRLF 转为 LF
find ~/.claude/plugins -name "*.sh" -exec dos2unix {} \;

# 或安装 dos2unix
# macOS: brew install dos2unix
# Ubuntu: sudo apt install dos2unix
```

---

## 获取帮助

如果问题仍然存在：

1. **查看 GitHub Issues**：[github.com/yusei21/yus/issues](https://github.com/yusei21/yus/issues)
2. **开启调试日志**：
   ```bash
   export CLAUDE_DEBUG=1
   export CLAUDE_LOG_LEVEL=debug
   ```
3. **收集诊断信息**：
   ```bash
   claude --version
   node --version
   python3 --version
   echo $CLAUDE_PACKAGE_MANAGER
   ls -la ~/.claude/plugins/cache/
   ```
4. **提交 issue**：附上调试日志、错误信息和诊断信息

---

## 相关文档

- [README.zh-CN.md](./README.zh-CN.md) - 安装与功能
- [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md) - 开发指南
- [docs/](./docs/) - 详细文档（英文）
- [examples/](./examples/) - 使用示例
