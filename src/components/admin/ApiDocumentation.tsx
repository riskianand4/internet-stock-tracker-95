import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Code, Copy, ChevronDown, ChevronRight, Book, Zap, Shield, Settings } from 'lucide-react';
import { toast } from 'sonner';
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    type: string;
    example: any;
  };
  responses: {
    status: number;
    description: string;
    example?: any;
  }[];
  permissions: string[];
}
const API_ENDPOINTS: ApiEndpoint[] = [{
  method: 'GET',
  path: '/api/products',
  description: 'Retrieve a list of all products with optional filtering and pagination',
  parameters: [{
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (default: 1)'
  }, {
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Items per page (default: 20)'
  }, {
    name: 'category',
    type: 'string',
    required: false,
    description: 'Filter by category'
  }, {
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search in product name/description'
  }],
  responses: [{
    status: 200,
    description: 'List of products retrieved successfully',
    example: {
      success: true,
      data: [{
        id: '1',
        name: 'Laptop Pro',
        description: 'High-performance laptop',
        sku: 'LAP-001',
        category: 'electronics',
        price: 1299.99,
        cost: 899.99,
        currentStock: 25,
        minimumStock: 5
      }],
      pagination: {
        page: 1,
        limit: 20,
        total: 150,
        pages: 8
      }
    }
  }],
  permissions: ['read']
}, {
  method: 'POST',
  path: '/api/products',
  description: 'Create a new product',
  requestBody: {
    type: 'object',
    example: {
      name: 'New Product',
      description: 'Product description',
      sku: 'PROD-001',
      category: 'electronics',
      price: 299.99,
      cost: 199.99,
      minimumStock: 10
    }
  },
  responses: [{
    status: 201,
    description: 'Product created successfully',
    example: {
      success: true,
      data: {
        id: '2',
        name: 'New Product',
        description: 'Product description',
        sku: 'PROD-001',
        category: 'electronics',
        price: 299.99,
        cost: 199.99,
        currentStock: 0,
        minimumStock: 10,
        createdAt: '2024-01-15T10:30:00Z'
      }
    }
  }],
  permissions: ['write']
}, {
  method: 'GET',
  path: '/api/inventory/stats',
  description: 'Get comprehensive inventory statistics and KPIs',
  responses: [{
    status: 200,
    description: 'Inventory statistics retrieved successfully',
    example: {
      success: true,
      data: {
        totalProducts: 150,
        totalValue: 125000.50,
        lowStockItems: 8,
        outOfStockItems: 3,
        categoryBreakdown: {
          electronics: 45,
          clothing: 32,
          books: 28
        }
      }
    }
  }],
  permissions: ['read']
}, {
  method: 'POST',
  path: '/api/inventory/movements',
  description: 'Record a stock movement (in, out, adjustment)',
  requestBody: {
    type: 'object',
    example: {
      productId: '1',
      type: 'in',
      quantity: 50,
      reason: 'Purchase order received',
      reference: 'PO-001'
    }
  },
  responses: [{
    status: 201,
    description: 'Stock movement recorded successfully',
    example: {
      success: true,
      data: {
        id: '3',
        productId: '1',
        type: 'in',
        quantity: 50,
        reason: 'Purchase order received',
        reference: 'PO-001',
        timestamp: '2024-01-15T10:30:00Z'
      }
    }
  }],
  permissions: ['write']
}, {
  method: 'GET',
  path: '/api/analytics/velocity',
  description: 'Get stock velocity analysis and turnover rates',
  parameters: [{
    name: 'period',
    type: 'string',
    required: false,
    description: 'Analysis period (7d, 30d, 90d)'
  }, {
    name: 'category',
    type: 'string',
    required: false,
    description: 'Filter by category'
  }],
  responses: [{
    status: 200,
    description: 'Velocity analysis retrieved successfully',
    example: {
      success: true,
      data: {
        averageTurnover: 4.2,
        fastMovingItems: [{
          productId: '1',
          turnoverRate: 8.5,
          daysToSellOut: 12
        }],
        slowMovingItems: [{
          productId: '2',
          turnoverRate: 0.8,
          daysToSellOut: 150
        }]
      }
    }
  }],
  permissions: ['analytics']
}];
export const ApiDocumentation: React.FC = () => {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const toggleEndpoint = (endpoint: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpoint)) {
      newExpanded.delete(endpoint);
    } else {
      newExpanded.add(endpoint);
    }
    setExpandedEndpoints(newExpanded);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-orange-100 text-orange-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getPermissionBadgeVariant = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'destructive';
      case 'write':
        return 'default';
      case 'analytics':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  return <div className="space-y-6">
      

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5" />
                API Overview
              </CardTitle>
              <CardDescription>
                The Inventory Management API provides comprehensive access to inventory data, analytics, and management functions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="bg-muted px-3 py-2 rounded block">https://your-api-domain.com</code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Full CRUD operations for products and inventory</li>
                  <li>Real-time stock movement tracking</li>
                  <li>Advanced analytics and reporting</li>
                  <li>Rate limiting and security controls</li>
                  <li>Comprehensive error handling</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All API responses follow a consistent JSON structure:
                </p>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                {`{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": { ... } // For paginated responses
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">API Key Authentication</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  All API requests must include a valid API key in the Authorization header:
                </p>
                <pre className="bg-muted p-3 rounded text-sm">
                {`Authorization: Bearer sk_live_your_api_key_here`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Permission Levels</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">read</Badge>
                    <span className="text-sm">Read-only access to products and inventory data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">write</Badge>
                    <span className="text-sm">Create, update, and modify inventory records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">analytics</Badge>
                    <span className="text-sm">Access to advanced analytics and reporting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">admin</Badge>
                    <span className="text-sm">Full administrative access including deletions</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Rate Limiting</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  API requests are rate limited based on your API key tier:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Basic: 1,000 requests per hour</li>
                  <li>Premium: 10,000 requests per hour</li>
                  <li>Enterprise: 100,000 requests per hour</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          {API_ENDPOINTS.map(endpoint => {
          const key = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoints.has(key);
          return <Card key={key}>
                <Collapsible>
                  <CollapsibleTrigger className="w-full" onClick={() => toggleEndpoint(key)}>
                    <CardHeader className="hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          <div className="flex gap-1">
                            {endpoint.permissions.map(permission => <Badge key={permission} variant={getPermissionBadgeVariant(permission)} className="text-xs">
                                {permission}
                              </Badge>)}
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <CardDescription className="text-left">
                        {endpoint.description}
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Parameters */}
                      {endpoint.parameters && <div>
                          <h5 className="font-semibold mb-2">Parameters</h5>
                          <div className="space-y-2">
                            {endpoint.parameters.map(param => <div key={param.name} className="border rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono">{param.name}</code>
                                  <Badge variant="outline" className="text-xs">
                                    {param.type}
                                  </Badge>
                                  {param.required && <Badge variant="destructive" className="text-xs">
                                      Required
                                    </Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">{param.description}</p>
                              </div>)}
                          </div>
                        </div>}

                      {/* Request Body */}
                      {endpoint.requestBody && <div>
                          <h5 className="font-semibold mb-2">Request Body</h5>
                          <div className="bg-muted p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{endpoint.requestBody.type}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody.example, null, 2))}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <pre className="text-sm overflow-x-auto">
                              {JSON.stringify(endpoint.requestBody.example, null, 2)}
                            </pre>
                          </div>
                        </div>}

                      {/* Responses */}
                      <div>
                        <h5 className="font-semibold mb-2">Responses</h5>
                        <div className="space-y-3">
                          {endpoint.responses.map(response => <div key={response.status} className="border rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={response.status < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {response.status}
                                </Badge>
                                <span className="text-sm">{response.description}</span>
                              </div>
                              {response.example && <div className="bg-muted p-2 rounded mt-2">
                                  <div className="flex justify-end mb-1">
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}>
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(response.example, null, 2)}
                                  </pre>
                                </div>}
                            </div>)}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>;
        })}
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">JavaScript/Node.js</h4>
                <div className="bg-muted p-4 rounded">
                  <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`// Get all products
const response = await fetch('https://your-api-domain.com/api/products', {
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                  {`// Get all products
const response = await fetch('https://your-api-domain.com/api/products', {
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Python</h4>
                <div className="bg-muted p-4 rounded">
                  <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`import requests

headers = {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
}

response = requests.get('https://your-api-domain.com/api/products', headers=headers)
data = response.json()
print(data)`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                  {`import requests

headers = {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
}

response = requests.get('https://your-api-domain.com/api/products', headers=headers)
data = response.json()
print(data)`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">cURL</h4>
                <div className="bg-muted p-4 rounded">
                  <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`curl -X GET "https://your-api-domain.com/api/products" \\
  -H "Authorization: Bearer sk_live_your_api_key_here" \\
  -H "Content-Type: application/json"`)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                  {`curl -X GET "https://your-api-domain.com/api/products" \\
  -H "Authorization: Bearer sk_live_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};