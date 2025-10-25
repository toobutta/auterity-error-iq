/**
 * Mock Data Utilities for Workflow Testing
 * Provides sample data for testing workflows in the sandbox environment
 */

export interface MockDataTemplate {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  category: 'customer' | 'product' | 'transaction' | 'system' | 'custom';
}

export const MOCK_DATA_TEMPLATES: MockDataTemplate[] = [
  {
    id: 'customer-basic',
    name: 'Basic Customer Data',
    description: 'Standard customer information for testing',
    category: 'customer',
    data: {
      customerId: 'CUST-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      preferences: {
        newsletter: true,
        smsNotifications: false
      }
    }
  },
  {
    id: 'product-inventory',
    name: 'Product Inventory Data',
    description: 'Sample product and inventory information',
    category: 'product',
    data: {
      productId: 'PROD-001',
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 99.99,
      inventory: {
        available: 150,
        reserved: 25,
        total: 175
      },
      specifications: {
        batteryLife: '30 hours',
        connectivity: 'Bluetooth 5.0',
        weight: '250g'
      }
    }
  },
  {
    id: 'transaction-order',
    name: 'Order Transaction Data',
    description: 'Sample e-commerce order data',
    category: 'transaction',
    data: {
      orderId: 'ORD-2025-001',
      customerId: 'CUST-001',
      items: [
        {
          productId: 'PROD-001',
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98
        }
      ],
      totalAmount: 199.98,
      taxAmount: 15.99,
      shippingAmount: 9.99,
      status: 'pending',
      orderDate: '2025-08-30T10:00:00Z',
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      }
    }
  },
  {
    id: 'system-health',
    name: 'System Health Metrics',
    description: 'Sample system monitoring data',
    category: 'system',
    data: {
      serverId: 'SRV-001',
      uptime: '99.9%',
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      diskUsage: 23.1,
      networkLatency: 12.5,
      activeConnections: 1250,
      errorRate: 0.02,
      lastMaintenance: '2025-08-25T08:00:00Z'
    }
  }
];

/**
 * Generate random mock data based on a template
 */
export function generateRandomMockData(template: MockDataTemplate): Record<string, any> {
  const data = { ...template.data };

  // Add some randomization for testing variability
  switch (template.category) {
    case 'customer':
      data.customerId = `CUST-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      data.firstName = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][Math.floor(Math.random() * 5)];
      data.lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)];
      break;

    case 'product':
      data.inventory.available = Math.floor(Math.random() * 200) + 50;
      data.price = Math.round((Math.random() * 500 + 50) * 100) / 100;
      break;

    case 'transaction':
      data.totalAmount = Math.round((Math.random() * 1000 + 50) * 100) / 100;
      data.orderId = `ORD-2025-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      break;

    case 'system':
      data.cpuUsage = Math.round((Math.random() * 100) * 10) / 10;
      data.memoryUsage = Math.round((Math.random() * 100) * 10) / 10;
      data.activeConnections = Math.floor(Math.random() * 2000) + 500;
      break;
  }

  return data;
}

/**
 * Get mock data templates by category
 */
export function getMockDataByCategory(category: MockDataTemplate['category']): MockDataTemplate[] {
  return MOCK_DATA_TEMPLATES.filter(template => template.category === category);
}

/**
 * Create custom mock data template
 */
export function createCustomMockData(
  name: string,
  description: string,
  data: Record<string, any>,
  category: MockDataTemplate['category'] = 'custom'
): MockDataTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    data,
    category
  };
}

/**
 * Validate mock data structure
 */
export function validateMockData(data: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Mock data must be a valid object');
  }

  // Check for common required fields based on structure
  if (data.customerId && typeof data.customerId !== 'string') {
    errors.push('customerId must be a string');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


