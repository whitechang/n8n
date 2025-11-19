#!/usr/bin/env node

import { resolve, join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { NodeGenerator } from './generator';
import { ConfigValidator } from './validator';

/**
 * 主函数
 */
async function main() {
	const args = process.argv.slice(2);

	// 显示帮助信息
	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		showHelp();
		process.exit(0);
	}

	// 获取配置文件路径
	const configPath = resolve(process.cwd(), args[0]);

	if (!existsSync(configPath)) {
		console.error(`❌ 错误: 配置文件不存在: ${configPath}`);
		process.exit(1);
	}

	console.log('🚀 n8n 节点生成器');
	console.log('━'.repeat(50));
	console.log(`📄 配置文件: ${configPath}`);

	try {
		const generator = new NodeGenerator();
		const validator = new ConfigValidator();

		// 1. 加载配置
		console.log('\n📦 加载配置...');
		const config = await generator.loadConfig(configPath);
		console.log(`   ✓ 节点名称: ${config.displayName}`);
		console.log(`   ✓ 节点类型: ${config.type || 'http'}`);

		// 2. 验证配置
		console.log('\n🔍 验证配置...');
		const validation = validator.validate(config);
		if (!validation.valid) {
			console.error('   ❌ 配置验证失败:');
			validation.errors.forEach((error) => console.error(`      • ${error}`));
			process.exit(1);
		}
		console.log('   ✓ 配置验证通过');

		// 3. 准备输出目录
		const nodeName = generator.getStandardizedNodeName(config);
		const outputDir = resolve(process.cwd(), 'output', nodeName);

		console.log(`\n📁 输出目录: ${outputDir}`);

		if (existsSync(outputDir)) {
			console.log('   ⚠️  目录已存在，将覆盖现有文件');
		} else {
			await mkdir(outputDir, { recursive: true });
			console.log('   ✓ 创建输出目录');
		}

		// 4. 生成节点代码
		console.log('\n⚙️  生成节点代码...');
		const templatePath = getTemplatePath(config.type || 'http');
		const nodeCode = await generator.generateNodeCode(config, templatePath);

		const nodeFilePath = join(outputDir, `${nodeName}.node.ts`);
		await writeFile(nodeFilePath, nodeCode, 'utf-8');
		console.log(`   ✓ 生成 ${nodeName}.node.ts`);

		// 5. 生成 JSON 配置
		const jsonConfig = generator.generateNodeJsonConfig(config);
		const jsonFilePath = join(outputDir, `${nodeName}.node.json`);
		await writeFile(jsonFilePath, jsonConfig, 'utf-8');
		console.log(`   ✓ 生成 ${nodeName}.node.json`);

		// 6. 完成
		console.log('\n✅ 节点生成成功！');
		console.log('━'.repeat(50));
		console.log('\n📋 下一步:');
		console.log(`   1. 查看生成的文件: ${outputDir}`);
		console.log(`   2. 将节点文件复制到你的 n8n 项目的 nodes 目录`);
		console.log(`   3. 在 n8n 项目中运行 npm run build`);
		console.log(`   4. 重启 n8n 即可使用新节点\n`);
	} catch (error: any) {
		console.error(`\n❌ 错误: ${error.message}`);
		if (error.stack) {
			console.error('\n堆栈跟踪:');
			console.error(error.stack);
		}
		process.exit(1);
	}
}

/**
 * 获取模板路径
 */
function getTemplatePath(type: string): string {
	const templatesDir = join(__dirname, '..', 'templates');
	const templateFile = `${type}-node.ts`;
	const templatePath = join(templatesDir, templateFile);

	if (!existsSync(templatePath)) {
		throw new Error(`模板文件不存在: ${templateFile} (仅支持: http-node.ts)`);
	}

	return templatePath;
}

/**
 * 显示帮助信息
 */
function showHelp() {
	console.log(`
n8n 节点生成器 - 从 JSON 配置生成 n8n 自定义节点

用法:
  node dist/index.js <config.json>

参数:
  config.json    节点配置文件路径

选项:
  -h, --help     显示帮助信息

示例:
  node dist/index.js examples/http-api.json
  node dist/index.js my-node-config.json

配置文件格式:
  {
    "name": "myNode",
    "displayName": "我的节点",
    "description": "节点描述",
    "type": "http",
    "apiUrl": "https://api.example.com",
    "properties": {
      "param1": {
        "type": "string",
        "displayName": "参数1",
        "description": "参数描述",
        "required": true
      }
    }
  }

更多信息请查看 README.md
`);
}

// 运行主函数
main().catch((error) => {
	console.error('未预期的错误:', error);
	process.exit(1);
});
