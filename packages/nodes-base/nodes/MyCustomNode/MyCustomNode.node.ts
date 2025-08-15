import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
	IHttpRequestMethods,
	NodeOperationError,
} from 'n8n-workflow';

export class MyCustomNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTTP Request Custom',
		name: 'myCustomNode',
		group: ['transform'],
		version: 1,
		description:
			'Custom node that sends HTTP requests and returns response data with configurable headers and body',
		defaults: {
			name: 'HTTP Request Custom',
			color: '#4CAF50',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'HTTP Method',
				name: 'method',
				type: 'options',
				options: [
					{
						name: 'GET',
						value: 'GET',
					},
					{
						name: 'POST',
						value: 'POST',
					},
					{
						name: 'PUT',
						value: 'PUT',
					},
					{
						name: 'DELETE',
						value: 'DELETE',
					},
				],
				default: 'GET',
				description: 'The HTTP method to use for the request',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://api.example.com/data',
				description: 'The URL to send the HTTP request to',
				required: true,
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'parameter',
						displayName: 'Header',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the header',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value of the header',
							},
						],
					},
				],
				description: 'Headers to send with the request',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				displayOptions: {
					show: {
						method: ['POST', 'PUT'],
					},
				},
				default: '{}',
				description: 'Body data to send with the request (for POST/PUT methods)',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
					},
					{
						name: 'Text',
						value: 'text',
					},
					{
						name: 'Binary',
						value: 'binary',
					},
				],
				default: 'json',
				description: 'The format to parse the response as',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get node parameters
				const method = this.getNodeParameter('method', itemIndex, 'GET') as string;
				const url = this.getNodeParameter('url', itemIndex, '') as string;
				const responseFormat = this.getNodeParameter('responseFormat', itemIndex, 'json') as string;
				const headersParameter = this.getNodeParameter(
					'headers.parameter',
					itemIndex,
					[],
				) as Array<{ name: string; value: string }>;

				// Validate URL
				if (!url) {
					throw new NodeOperationError(this.getNode(), 'URL is required', { itemIndex });
				}

				// Prepare headers
				const headers: Record<string, string> = {};
				for (const header of headersParameter) {
					if (header.name && header.value) {
						headers[header.name] = header.value;
					}
				}

				// Prepare request options
				const requestOptions: IHttpRequestOptions = {
					method: method as IHttpRequestMethods,
					url,
					headers,
					returnFullResponse: true,
				};

				// Add body for POST/PUT requests
				if (['POST', 'PUT'].includes(method)) {
					const bodyData = this.getNodeParameter('body', itemIndex, '{}') as string;
					try {
						requestOptions.body = JSON.parse(bodyData);
						if (!headers['Content-Type'] && !headers['content-type']) {
							headers['Content-Type'] = 'application/json';
						}
					} catch (error) {
						throw new NodeOperationError(this.getNode(), `Invalid JSON in body: ${error.message}`, {
							itemIndex,
						});
					}
				}

				// Make HTTP request
				const response = await this.helpers.httpRequest(requestOptions);

				// Process response based on format
				let responseData: any;
				switch (responseFormat) {
					case 'json':
						try {
							responseData =
								typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Failed to parse JSON response: ${error.message}`,
								{ itemIndex },
							);
						}
						break;
					case 'text':
						responseData = response.body;
						break;
					case 'binary':
						responseData = {
							data: response.body,
							mimeType: response.headers['content-type'] || 'application/octet-stream',
						};
						break;
					default:
						responseData = response.body;
				}

				// Prepare output data
				const outputItem: INodeExecutionData = {
					json: {
						statusCode: response.statusCode,
						headers: response.headers,
						data: responseData,
						url: url,
						method: method,
					},
					binary:
						responseFormat === 'binary'
							? {
									data: {
										data: response.body,
										mimeType: response.headers['content-type'] || 'application/octet-stream',
										fileName: 'response_data',
									},
								}
							: undefined,
				};

				// Copy original item data if needed
				if (items[itemIndex].json) {
					outputItem.json.originalData = items[itemIndex].json;
				}

				returnData.push(outputItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							statusCode: error.statusCode || null,
							url: this.getNodeParameter('url', itemIndex, '') as string,
							method: this.getNodeParameter('method', itemIndex, 'GET') as string,
						},
					});
				} else {
					throw error;
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
