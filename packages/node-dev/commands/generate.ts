/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Command, Flags } from '@oclif/core';
import * as changeCase from 'change-case';
import { access, writeFile, mkdir } from 'fs/promises';
import * as inquirer from 'inquirer';
import { join } from 'path';

import { JsonNodeGenerator } from '../src/JsonNodeGenerator';

export class Generate extends Command {
	static description = '从 JSON 配置文件生成 n8n 节点';

	static examples = [
		'$ n8n-node-dev generate',
		'$ n8n-node-dev generate --config ./my-config.json',
		'$ n8n-node-dev generate --config ./my-config.json --output ./my-nodes',
	];

	static flags = {
		help: Flags.help({ char: 'h' }),
		config: Flags.string({
			char: 'c',
			description: 'JSON 配置文件路径（默认：./config.json）',
			default: './config.json',
		}),
		output: Flags.string({
			char: 'o',
			description: '输出目录路径（默认：./nodes）',
			default: './nodes',
		}),
	};

	async run() {
		try {
			const { flags } = await this.parse(Generate);

			this.log('\n从 JSON 配置生成 n8n 节点');
			this.log('===============================');

			let configPath = flags.config;
			let outputDir = flags.output;

			// 检查默认配置文件是否存在，如果不存在则询问用户
			try {
				await access(configPath);
			} catch {
				// 默认配置文件不存在，询问用户
				const configQuestion: inquirer.QuestionCollection = {
					name: 'configPath',
					type: 'input',
					message: '默认配置文件 ./config.json 不存在，请输入 JSON 配置文件路径:',
					default: './config.json',
					validate: async (input: string) => {
						try {
							await access(input);
							return true;
						} catch {
							return '配置文件不存在，请检查路径是否正确';
						}
					},
				};

				const configAnswer = await inquirer.prompt(configQuestion);
				configPath = configAnswer.configPath;
			}

			// 最终验证配置文件是否存在
			try {
				await access(configPath);
			} catch {
				this.error(`配置文件不存在: ${configPath}`);
			}

			// 初始化生成器并加载配置
			const generator = new JsonNodeGenerator();
			const config = await generator.loadConfig(configPath);

			this.log(`\n加载配置成功:`);
			this.log(`  节点名称: ${config.displayName}`);
			this.log(`  描述: ${config.description}`);
			this.log(`  版本: ${config.version || '1.0.0'}`);

			// 输出目录已经有默认值，直接使用

			// 获取标准化的节点名称
			const nodeName = generator.getStandardizedNodeName(config);
			const nodeDir = join(outputDir, nodeName);
			const nodeFilePath = join(nodeDir, `${nodeName}.node.ts`);
			const jsonFilePath = join(nodeDir, `${nodeName}.node.json`);

			// 检查输出目录是否已存在
			try {
				await access(nodeDir);

				// 目录已存在，询问是否覆盖
				const overwriteQuestion: inquirer.QuestionCollection = {
					name: 'overwrite',
					type: 'confirm',
					default: false,
					message: `目录 "${nodeDir}" 已存在，是否覆盖？`,
				};

				const overwriteAnswer = await inquirer.prompt(overwriteQuestion);

				if (!overwriteAnswer.overwrite) {
					this.log('\n节点生成已取消！');
					return;
				}
			} catch {
				// 目录不存在，正常继续
			}

			// 创建输出目录
			await mkdir(nodeDir, { recursive: true });

			// 生成节点代码
			const nodeTemplatePath = join(__dirname, '../../templates/json-generated/node.ts');
			const nodeCode = await generator.generateNodeCode(config, nodeTemplatePath);

			// 生成JSON配置
			const jsonConfig = generator.generateNodeJsonConfig(config);

			// 写入文件
			await writeFile(nodeFilePath, nodeCode, 'utf-8');
			await writeFile(jsonFilePath, jsonConfig, 'utf-8');

			this.log('\n生成成功！');
			this.log('====================');
			this.log(`节点目录已生成: ${nodeDir}`);
			this.log(`  - ${nodeName}.node.ts`);
			this.log(`  - ${nodeName}.node.json`);
			this.log(`\n节点信息:`);
			this.log(`  类名: ${nodeName}`);
			this.log(`  显示名称: ${config.displayName}`);
			this.log(`  内部名称: ${changeCase.camelCase(config.name)}`);
			this.log(`  API 地址: ${config.api_url || 'http://127.0.0.1:5000/api/execute'}`);

			const propertyCount = Object.keys(config.input_schema.properties).length;
			this.log(`  参数数量: ${propertyCount}`);

			this.log('\n使用说明:');
			this.log('1. 将生成的节点目录复制到你的 n8n 节点项目中');
			this.log('2. 确保对应的 API 服务正在运行');
			this.log('3. 重新构建并重启 n8n 以加载新节点');
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			this.error(`生成失败: ${error.message}`);
		}
	}
}
