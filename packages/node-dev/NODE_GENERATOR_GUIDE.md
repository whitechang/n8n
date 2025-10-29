# n8n 节点生成器使用指南

## 概述

n8n 节点生成器是一个强大的命令行工具，可以从 JSON 配置文件自动生成完整的 n8n 节点结构。该工具能够生成标准化的节点文件夹，包含 `.node.ts` 文件和对应的 `.node.json` 配置文件。

## 主要特性

✅ **完整节点结构生成**：自动创建包含 TypeScript 节点文件和 JSON 配置文件的完整目录结构
✅ **标准化命名**：确保文件夹名称、节点文件名、JSON 文件名和节点类名称完全一致
✅ **智能属性映射**：自动将 JSON Schema 属性转换为 n8n 节点属性
✅ **类型安全**：生成的代码包含完整的 TypeScript 类型定义
✅ **API 集成**：内置 HTTP 请求处理和错误管理
✅ **交互式配置**：支持命令行参数和交互式配置

## 安装和设置

### 前置要求
- Node.js 16+ 
- npm 或 pnpm
- n8n 开发环境

### 安装
```bash
cd packages/node-dev
npm install
npm run build-node-dev
```

## 快速开始

### 超快速开始

```bash
# 1. 进入目录
cd packages/node-dev

# 2. 构建工具
npm run build-node-dev

# 3. 直接生成（使用默认的 config.json 和 nodes 目录）
npx n8n-node-dev generate
```

### 1. 创建配置文件

创建一个 JSON 配置文件，命名为 `config.json`（默认）或自定义名称：

```json
{
  "name": "textProcessor",
  "displayName": "文本处理器",
  "description": "用于处理文本的强大节点",
  "version": "1.0.0",
  "icon": "file:text-processor.svg",
  "group": ["transform"],
  "color": "#4CAF50",
  "api_url": "http://127.0.0.1:8080/api/process-text",
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
        "enum": ["uppercase", "lowercase", "reverse", "trim"],
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

### 2. 生成节点

```bash
# 使用默认配置（config.json -> nodes 目录）
npx n8n-node-dev generate

# 或指定自定义配置
npx n8n-node-dev generate --config ./my-config.json --output ./my-nodes
```

### 3. 生成结果

工具会创建以下目录结构：
```
nodes/
└── TextProcessor/
    ├── TextProcessor.node.ts
    └── TextProcessor.node.json
```

## 配置文件详解

### 基本配置

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | ✅ | 节点内部名称（用于生成类名和文件名） |
| `displayName` | string | ✅ | 节点显示名称 |
| `description` | string | ✅ | 节点描述 |
| `version` | string | ❌ | 节点版本（默认：1.0.0） |
| `icon` | string | ❌ | 节点图标（默认：file:n8n.svg） |
| `group` | string[] | ❌ | 节点分组（默认：["transform"]） |
| `color` | string | ❌ | 节点颜色（默认：#4CAF50） |
| `api_url` | string | ❌ | API 端点 URL |

### 输入模式配置

`input_schema` 定义了节点的输入参数：

```json
{
  "input_schema": {
    "type": "object",
    "properties": {
      "参数名": {
        "type": "数据类型",
        "description": "参数描述",
        "default": "默认值",
        "required": true/false,
        "placeholder": "占位符文本",
        "enum": ["选项1", "选项2"]
      }
    },
    "required": ["必需参数列表"]
  }
}
```

### 支持的数据类型

| JSON Schema 类型 | n8n 属性类型 | 描述 |
|------------------|--------------|------|
| `string` | `string` | 文本输入 |
| `string` + `enum` | `options` | 单选下拉框 |
| `number`/`integer` | `number` | 数字输入 |
| `boolean` | `boolean` | 开关选项 |
| `array` + `items.enum` | `multiOptions` | 多选选项 |
| `object` | `collection` | 对象集合 |

### 高级配置示例

```json
{
  "name": "advancedProcessor",
  "displayName": "高级处理器",
  "description": "支持复杂配置的处理器节点",
  "version": "2.1.0",
  "icon": "file:advanced.svg",
  "group": ["transform", "utility"],
  "color": "#2196F3",
  "api_url": "https://api.example.com/v2/process",
  "input_schema": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "description": "处理模式",
        "enum": ["fast", "accurate", "balanced"],
        "default": "balanced"
      },
      "options": {
        "type": "array",
        "description": "处理选项",
        "items": {
          "enum": ["compress", "encrypt", "validate", "format"]
        },
        "default": ["validate"]
      },
      "settings": {
        "type": "object",
        "description": "高级设置",
        "properties": {
          "timeout": {
            "type": "number",
            "description": "超时时间（秒）",
            "default": 30
          },
          "retries": {
            "type": "integer",
            "description": "重试次数",
            "default": 3
          }
        }
      },
      "enableDebug": {
        "type": "boolean",
        "description": "启用调试模式",
        "default": false
      }
    },
    "required": ["mode"]
  }
}
```

## 命令行选项

### generate 命令

```bash
npx n8n-node-dev generate [选项]
```

#### 选项

| 选项 | 简写 | 描述 | 示例 |
|------|------|------|------|
| `--config` | `-c` | JSON 配置文件路径 | `--config ./config.json` |
| `--output` | `-o` | 输出目录路径 | `--output ./nodes` |
| `--help` | `-h` | 显示帮助信息 | `--help` |

#### 使用示例

```bash
# 使用默认配置（推荐）
npx n8n-node-dev generate

# 指定配置文件（输出到默认 nodes 目录）
npx n8n-node-dev generate --config ./my-config.json

# 指定输出目录（使用默认 config.json）
npx n8n-node-dev generate --output ./custom-nodes

# 完整自定义命令
npx n8n-node-dev generate -c ./my-config.json -o ./my-nodes
```

#### 默认值

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--config` / `-c` | `./config.json` | 配置文件路径 |
| `--output` / `-o` | `./nodes` | 输出目录路径 |

## 生成的文件结构

### 目录结构
```
输出目录/
└── [节点名称]/
    ├── [节点名称].node.ts      # TypeScript 节点实现
    └── [节点名称].node.json    # 节点配置文件
```

### 文件命名规则
- **文件夹名称**：PascalCase（如：TextProcessor）
- **节点类名**：PascalCase（如：TextProcessor）
- **文件名**：PascalCase.node.ts/json（如：TextProcessor.node.ts）
- **节点内部名**：camelCase（如：textProcessor）

## 集成到 n8n 项目

### 1. 复制节点文件
将生成的节点目录复制到你的 n8n 项目的节点目录中：

```bash
cp -r ./nodes/TextProcessor /path/to/your/n8n-project/packages/nodes-base/nodes/
```

### 2. 更新 package.json
在 `packages/nodes-base/package.json` 中添加节点引用：

```json
{
  "n8n": {
    "nodes": [
      "dist/nodes/TextProcessor/TextProcessor.node.js"
    ]
  }
}
```

### 3. 重新构建项目
```bash
npm run build
```

### 4. 重启 n8n
```bash
npm run start
```

## API 服务端实现

生成的节点会向指定的 API 端点发送 POST 请求。你需要实现对应的服务端接口：

### 请求格式
```json
{
  "参数名1": "参数值1",
  "参数名2": "参数值2"
}
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "result": "处理结果"
  },
  "message": "处理成功"
}
```

### Python Flask 示例
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/process-text', methods=['POST'])
def process_text():
    data = request.json
    text = data.get('text', '')
    operation = data.get('operation', 'uppercase')
    
    if operation == 'uppercase':
        result = text.upper()
    elif operation == 'lowercase':
        result = text.lower()
    elif operation == 'reverse':
        result = text[::-1]
    elif operation == 'trim':
        result = text.strip()
    else:
        result = text
    
    return jsonify({
        'success': True,
        'data': {'result': result},
        'message': '处理成功'
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
```

## 故障排除

### 常见问题

#### 1. 构建失败
**问题**：TypeScript 编译错误
**解决方案**：
```bash
npm run build-node-dev
```

#### 2. 节点不显示
**问题**：生成的节点在 n8n 中不显示
**解决方案**：
- 检查 package.json 中的节点注册
- 确保文件路径正确
- 重新构建并重启 n8n

#### 3. API 请求失败
**问题**：节点执行时 API 请求失败
**解决方案**：
- 检查 API 服务是否运行
- 验证 API URL 是否正确
- 检查请求和响应格式

#### 4. 参数不显示
**问题**：节点参数在界面中不显示
**解决方案**：
- 检查 input_schema 格式是否正确
- 验证属性类型映射
- 查看浏览器控制台错误

### 调试技巧

1. **查看生成的代码**：检查生成的 .node.ts 文件是否正确
2. **验证配置文件**：使用 JSON 验证器检查配置文件格式
3. **测试 API 接口**：使用 Postman 或 curl 测试 API 端点
4. **查看 n8n 日志**：检查 n8n 控制台输出的错误信息

## 最佳实践

### 1. 配置文件组织
```
project/
├── configs/
│   ├── text-processor.json
│   ├── data-transformer.json
│   └── api-connector.json
├── generated-nodes/
└── scripts/
    └── generate-all-nodes.sh
```

### 2. 批量生成脚本
```bash
#!/bin/bash
# generate-all-nodes.sh

configs=("text-processor" "data-transformer" "api-connector")

for config in "${configs[@]}"; do
    echo "生成节点: $config"
    npx n8n-node-dev generate \
        --config "./configs/${config}.json" \
        --output "./generated-nodes"
done

echo "所有节点生成完成！"
```

### 3. 版本管理
- 为每个配置文件设置明确的版本号
- 使用语义化版本控制
- 在更新时递增版本号

### 4. 文档维护
- 为每个节点创建使用文档
- 记录 API 接口规范
- 维护变更日志

## 扩展功能

### 自定义模板
你可以修改 `templates/json-generated/` 目录中的模板文件来自定义生成的代码结构。

### 添加新的属性类型
在 `JsonNodeGenerator.ts` 中的 `mapTypeToN8nType` 方法中添加新的类型映射。

### 集成 CI/CD
```yaml
# .github/workflows/generate-nodes.yml
name: Generate Nodes
on:
  push:
    paths:
      - 'configs/*.json'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Generate nodes
        run: ./scripts/generate-all-nodes.sh
      - name: Commit generated files
        run: |
          git add generated-nodes/
          git commit -m "Auto-generate nodes"
          git push
```

## 支持和贡献

### 获取帮助
- 查看命令帮助：`npx n8n-node-dev generate --help`
- 检查示例配置：`packages/node-dev/examples/`
- 阅读源代码：`packages/node-dev/src/JsonNodeGenerator.ts`

### 贡献代码
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

---

**版本**：1.0.0  
**最后更新**：2025年10月29日  
**作者**：n8n 开发团队
