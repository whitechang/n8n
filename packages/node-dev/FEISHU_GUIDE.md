# n8n 节点生成器使用指南

## ⚡ 超快速开始

```bash
# 1. 进入目录
cd packages/node-dev

# 2. 构建工具
npm run build-node-dev

# 3. 直接生成（使用默认配置）
npx n8n-node-dev generate
```

> 💡 **提示**：工具会自动使用 `config.json` 配置文件，输出到 `nodes` 目录

## 🚀 详细步骤

### 1️⃣ 创建配置文件

创建 JSON 配置文件，命名为 `config.json`（默认）或自定义名称：

> 📁 **默认配置**：工具已提供 `config.json` 示例文件，可直接使用或修改

```json
{
  "name": "textProcessor",
  "displayName": "文本处理器", 
  "description": "用于处理文本的节点",
  "version": "1.0.0",
  "icon": "file:text.svg",
  "group": ["transform"],
  "color": "#4CAF50",
  "api_url": "http://127.0.0.1:8080/api/process",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "要处理的文本",
        "required": true,
        "placeholder": "请输入文本..."
      },
      "operation": {
        "type": "string", 
        "description": "处理操作",
        "enum": ["uppercase", "lowercase", "reverse"],
        "default": "uppercase"
      },
      "includeMetadata": {
        "type": "boolean",
        "description": "包含元数据",
        "default": false
      }
    },
    "required": ["text"]
  }
}
```

### 2️⃣ 生成节点

```bash
# 进入 node-dev 目录
cd packages/node-dev

# 构建工具
npm run build-node-dev

# 使用默认配置生成节点（使用 config.json，输出到 nodes 目录）
npx n8n-node-dev generate

# 或指定自定义配置文件和输出目录
npx n8n-node-dev generate --config ./my-config.json --output ./my-nodes
```

### 3️⃣ 生成结果

自动创建完整的节点目录结构：

```
nodes/
└── TextProcessor/
    ├── TextProcessor.node.ts      # TypeScript 节点文件
    └── TextProcessor.node.json    # 节点配置文件
```

## ⚙️ 配置说明

### 基本配置

| 字段 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `name` | ✅ | 节点名称（用于生成类名） | `"textProcessor"` |
| `displayName` | ✅ | 显示名称 | `"文本处理器"` |
| `description` | ✅ | 节点描述 | `"处理文本的节点"` |
| `version` | ❌ | 版本号 | `"1.0.0"` |
| `icon` | ❌ | 图标文件 | `"file:icon.svg"` |
| `group` | ❌ | 分组 | `["transform"]` |
| `color` | ❌ | 节点颜色 | `"#4CAF50"` |
| `api_url` | ❌ | API 地址 | `"http://localhost:8080/api"` |

### 参数类型映射

| JSON 类型 | n8n 类型 | 界面效果 |
|-----------|----------|----------|
| `string` | `string` | 文本输入框 |
| `string` + `enum` | `options` | 下拉选择 |
| `number` | `number` | 数字输入 |
| `boolean` | `boolean` | 开关按钮 |
| `array` + `enum` | `multiOptions` | 多选框 |

## 🛠️ 命令选项

```bash
# 基本用法（使用默认的 config.json 和 nodes 目录）
npx n8n-node-dev generate

# 指定配置文件（输出到默认的 nodes 目录）
npx n8n-node-dev generate --config ./my-config.json

# 指定输出目录（使用默认的 config.json）
npx n8n-node-dev generate --output ./my-nodes

# 同时指定配置文件和输出目录
npx n8n-node-dev generate --config ./my-config.json --output ./my-nodes

# 查看帮助
npx n8n-node-dev generate --help
```

### 默认值说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--config` / `-c` | `./config.json` | 配置文件路径 |
| `--output` / `-o` | `./nodes` | 输出目录路径 |

## 📁 文件命名规则

所有相关文件使用统一的命名规则：

- **文件夹名**：`TextProcessor`
- **类名**：`TextProcessor` 
- **文件名**：`TextProcessor.node.ts` / `TextProcessor.node.json`
- **内部名**：`textProcessor`

## 🔧 集成到 n8n

### 1. 复制节点文件

将生成的nodes文件夹下的节点整体复制到node-base/nodes下
修改node-base/package.json中的n8n/nodes信息，添加刚刚的节点路径

### 2. 重新构建 node-base

```bash
pnpm run build
```

### 3. 重新启动n8n项目