import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Divider,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { SteeringRule, RuleEvaluationContext } from './types';
import ReactJson from 'react-json-view';

interface TestRuleDialogProps {
  open: boolean;
  onClose: () => void;
  rule: SteeringRule | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`test-rule-tabpanel-${index}`}
      aria-labelledby={`test-rule-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TestRuleDialog: React.FC<TestRuleDialogProps> = ({ open, onClose, rule }) => {
  const [testContext, setTestContext] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  const api = useApi();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTest = async () => {
    if (!rule) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse the test context
      let parsedContext: RuleEvaluationContext;
      try {
        parsedContext = JSON.parse(testContext);
      } catch (err) {
        throw new Error('Invalid JSON format for test context');
      }

      // Send the test request
      const response = await api.post('/admin/steering/test', {
        rule,
        context: parsedContext
      });

      setResult(response.data);
    } catch (err: any) {
      console.error('Error testing rule:', err);
      setError(err.response?.data?.error || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTestContext('');
    setResult(null);
    setError(null);
    setTabValue(0);
  };

  // Generate a sample context based on the rule's conditions
  const generateSampleContext = () => {
    if (!rule) return;

    const sampleContext: any = {
      request: {
        body: {
          prompt: "This is a sample prompt for testing",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "This is a sample message for testing"
            }
          ]
        },
        headers: {
          authorization: "Bearer sample_token",
          "x-api-key": "sample_api_key"
        },
        path: "/v1/openai/chat/completions",
        method: "POST",
        ip: "127.0.0.1"
      },
      user: {
        id: "user_123",
        email: "user@example.com",
        tier: "premium",
        role: "user"
      },
      organization: {
        id: "org_123",
        name: "Example Organization",
        tier: "enterprise"
      },
      context: {
        tokenCount: 150,
        timestamp: new Date().toISOString(),
        clientIp: "127.0.0.1",
        userAgent: "Mozilla/5.0"
      }
    };

    setTestContext(JSON.stringify(sampleContext, null, 2));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>Test Rule: {rule?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Test your rule against a sample request context
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={generateSampleContext}
            sx={{ mb: 2 }}
          >
            Generate Sample Context
          </Button>
          <TextField
            label="Test Context (JSON)"
            multiline
            rows={10}
            value={testContext}
            onChange={(e) => setTestContext(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder='{"request": {"body": {"prompt": "test"}}}'
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="test results tabs">
              <Tab label="Summary" />
              <Tab label="Detailed Results" />
              <Tab label="Modified Context" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rule Match: {result.results[0]?.matched ? 'Yes' : 'No'}
                </Typography>
                {result.results[0]?.matched && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Actions Applied:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {result.results[0].actions.map((action: any, index: number) => (
                        <Typography key={index} variant="body2">
                          • {action.type}: {JSON.stringify(action.params)}
                        </Typography>
                      ))}
                    </Box>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      Continue to next rule: {result.results[0].continue ? 'Yes' : 'No'}
                    </Typography>
                  </>
                )}
              </Paper>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <ReactJson 
                src={result.results} 
                name="results" 
                collapsed={1} 
                displayDataTypes={false}
                enableClipboard={false}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <ReactJson 
                src={result.context} 
                name="context" 
                collapsed={1} 
                displayDataTypes={false}
                enableClipboard={false}
              />
            </TabPanel>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} disabled={loading}>
          Reset
        </Button>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button 
          onClick={handleTest} 
          variant="contained" 
          color="primary" 
          disabled={loading || !testContext}
        >
          {loading ? <CircularProgress size={24} /> : 'Test Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestRuleDialog;