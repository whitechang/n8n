# n8n Node Builder

从 JSON 配置文件快速生成 n8n 自定义节点的简化工具。

## 特性

✅ **简单易用** - 一条命令即可生成节点
✅ **配置驱动** - 通过 JSON 配置定义节点行为
✅ **类型安全** - 完整的 TypeScript 支持
✅ **内置模板** - 提供常用的 HTTP 节点模板
✅ **验证机制** - 自动验证配置文件的正确性
✅ **兼容旧格式** - 支持 node-dev 的配置格式（自动转换）

## 快速开始

### 1. 安装依赖

```bash
cd packages/n8n-node-builder
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 生成节点

```bash
# 使用示例配置
node dist/index.js examples/http-api.json

# 使用自定义配置
node dist/index.js my-node-config.json
```

生成的节点文件将保存在 `output/` 目录下。

## 配置文件格式

### 基本配置

```json
{
  "name": "myNode",
  "displayName": "我的节点",
  "description": "节点功能描述",
  "type": "http",
  "apiUrl": "https://api.example.com",
  "properties": {
    // 节点属性配置
  }
}
```

### 配置字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 节点内部名称（camelCase） |
| `displayName` | string | ✅ | 节点显示名称 |
| `description` | string | ✅ | 节点描述 |
| `type` | string | ❌ | 节点类型（默认: `http`） |
| `apiUrl` | string | ❌ | API 基础 URL |
| `version` | number | ❌ | 版本号（默认: `1`） |
| `icon` | string | ❌ | 图标文件名（默认: `file:icon.svg`） |
| `group` | string[] | ❌ | 分组（默认: `["transform"]`） |
| `color` | string | ❌ | 颜色（默认: `#1A82e2`） |
| `properties` | object | ✅ | 属性配置 |

### 属性配置

每个属性支持以下字段：

```json
{
  "propertyName": {
    "type": "string",           // 数据类型
    "displayName": "属性名称",   // 显示名称
    "description": "属性描述",   // 描述（可选）
    "placeholder": "占位符",     // 占位符文本（可选）
    "required": true,           // 是否必需（可选）
    "default": "默认值",         // 默认值（可选）
    "enum": ["选项1", "选项2"]   // 枚举值（可选）
  }
}
```

### 支持的数据类型

| 类型 | n8n 类型 | 说明 |
|------|----------|------|
| `string` | string / options | 字符串（带 `enum` 时为选项） |
| `number` | number | 数字 |
| `integer` | number | 整数 |
| `boolean` | boolean | 布尔值 |
| `array` | collection / multiOptions | 数组（带 `items.enum` 时为多选） |
| `object` | collection | 对象 |

## 配置示例

### 示例 1: HTTP API 节点

```json
{
  "name": "myApiNode",
  "displayName": "我的 API 节点",
  "description": "调用自定义 API 并处理响应",
  "type": "http",
  "apiUrl": "https://api.example.com/process",
  "color": "#FF6B6B",
  "properties": {
    "inputText": {
      "type": "string",
      "displayName": "输入文本",
      "description": "要处理的文本内容",
      "required": true
    },
    "operation": {
      "type": "string",
      "displayName": "操作类型",
      "enum": ["uppercase", "lowercase", "reverse"],
      "default": "uppercase"
    },
    "includeMetadata": {
      "type": "boolean",
      "displayName": "包含元数据",
      "default": false
    }
  }
}
```

### 示例 2: 数据处理节点

```json
{
  "name": "dataProcessor",
  "displayName": "数据处理器",
  "description": "处理和转换数据",
  "type": "http",
  "apiUrl": "http://127.0.0.1:5000/api/process",
  "properties": {
    "processingMode": {
      "type": "string",
      "displayName": "处理模式",
      "enum": ["transform", "filter", "aggregate"],
      "default": "transform"
    },
    "batchSize": {
      "type": "integer",
      "displayName": "批处理大小",
      "default": 100
    }
  }
}
```

## 使用生成的节点

1. **复制节点文件**
   ```bash
   cp -r output/MyNode /path/to/n8n/packages/nodes-base/nodes/
   ```

2. **构建 n8n**
   ```bash
   cd /path/to/n8n
   npm run build
   ```

3. **重启 n8n**
   ```bash
   npm run start
   ```

4. **在 n8n 界面中使用**
   打开 n8n，搜索你的节点名称即可找到并使用。

## 项目结构

```
n8n-node-builder/
├── src/                    # 源代码
│   ├── index.ts           # 主入口
│   ├── generator.ts       # 节点生成器
│   ├── validator.ts       # 配置验证器
│   └── types.ts           # 类型定义
├── templates/             # 节点模板
│   └── http-node.ts       # HTTP 节点模板
├── examples/              # 示例配置
│   ├── http-api.json
│   └── data-processor.json
├── output/                # 输出目录（生成的节点）
├── package.json
├── tsconfig.json
└── README.md
```

## 命令行选项

```bash
# 显示帮助
node dist/index.js --help

# 生成节点
node dist/index.js <config.json>
```

## 配置格式兼容性

n8n-node-builder 支持两种配置格式：

### 新格式（推荐）

使用 `properties` 字段直接定义属性，更简洁清晰。

### 旧格式（node-dev 兼容）

使用 `input_schema` 包装属性定义，自动转换为新格式处理。

**详见：** [COMPATIBILITY.md](./COMPATIBILITY.md)

#### 快速示例

旧格式配置自动兼容：

```bash
# 如果有现成的 node-dev 配置，直接使用
node dist/index.js config.json
```

## 常见问题

### Q: 我有 node-dev 的旧配置，可以直接用吗？

A: 可以！工具会自动兼容 node-dev 的配置格式（input_schema、api_url 等）。详见 [COMPATIBILITY.md](./COMPATIBILITY.md)。

### Q: 如何修改生成的节点？

A: 生成的节点文件是标准的 TypeScript 代码，你可以直接编辑 `output/` 目录下的文件。

### Q: 支持哪些节点类型？

A: 当前支持 HTTP 节点。后续会添加 Webhook 和 Trigger 节点模板。

### Q: 如何自定义节点模板？

A: 编辑 `templates/http-node.ts` 文件，使用占位符（如 `ClassNameReplace`）来标记需要替换的内容。

### Q: 配置验证失败怎么办？

A: 检查配置文件是否包含所有必需字段，并确保字段格式正确。错误信息会提示具体问题。详见 [COMPATIBILITY.md](./COMPATIBILITY.md#验证规则)。

## 开发

### 监听模式

```bash
npm run watch
```

### 清理输出

```bash
npm run clean
```

## 与 node-dev 的区别

| 特性 | node-dev | n8n-node-builder |
|------|----------|------------------|
| 命令执行 | `npx n8n-node-dev generate` | `node dist/index.js config.json` |
| 交互式 CLI | ✅ | ❌ |
| 配置格式 | 复杂 | 简化 |
| 依赖 | oclif, inquirer 等 | 仅 change-case |
| 构建功能 | ✅ | ❌ |
| 模板创建 | ✅ | ❌ |
| 专注度 | 多功能 | 单一生成 |

## 后续计划

- [ ] 添加 Webhook 节点模板
- [ ] 添加 Trigger 节点模板
- [ ] 支持自定义模板路径
- [ ] 支持批量生成节点
- [ ] 提供更多配置示例

## 许可证

MIT
