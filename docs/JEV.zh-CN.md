# Jev AI — 使用指南

[English](./JEV.md) | [Português](./JEV.pt-BR.md) | **简体中文**

规范技能 [`jev-agent`](../skills/jev-agent/SKILL.md) 为 Jev AI 类型化决策 API 提供本仓库原创集成说明。上游参考：https://github.com/jev-ai/jev-agent-skill 。这里没有再分发上游源文件。

## 配置

在仓库根目录启动编程 Agent。在 https://thejevai.com/settings/apikeys 创建密钥，并在本地环境配置：

```bash
export JEV_API_KEY="sk_your_key_here"
export JEV_LANGUAGE="zh-CN"
```

上游支持 `en-US` 与 `zh-CN` 指南。可选默认值：`JEV_API_BASE_URL=https://thejevai.com`、`JEV_MODEL=typesafe/jev-1.13`。不要把真实密钥写入 Git、日志或对话。

## 示例提示

```text
使用 jev-agent 将此工单分类为 billing、technical 或 sales。
返回所选类别和置信度，但不要执行任何操作。
工单：“我被重复扣费了。”
```

`choice` 用于候选分类，`score` 用于有序评分，`noul` 用于是/否概率。请求示例见 [SKILL.md](../skills/jev-agent/SKILL.md)。API 调用可能产生费用并传输数据，请只传必要内容、检查错误、保留权限检查和人工审批。实际调用需要有效密钥及网络访问。文档：https://thejevai.com/docs。
