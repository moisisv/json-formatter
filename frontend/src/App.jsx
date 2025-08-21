import { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Snackbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import ReactJson from "react-json-view";
import Editor from "@monaco-editor/react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const LOCAL_STORAGE_KEY = "json_history";

function App() {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [history, setHistory] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [tab, setTab] = useState(0);
  const [parsedJson, setParsedJson] = useState(null);

  // Base64 states
  const [base64Input, setBase64Input] = useState("");
  const [base64Output, setBase64Output] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (formattedJson) => {
    const newEntry = {
      id: Date.now(),
      json: formattedJson,
    };
    const newHistory = [newEntry, ...history.slice(0, 49)];
    setHistory(newHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
  };

  const handleFormat = async () => {
    setError("");
    setShowAlert(false);

    try {
      const res = await fetch("http://localhost:3001/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: jsonText }),
      });

      const data = await res.json();

      if (data.success) {
        setJsonText(data.output);
        saveToHistory(data.output);
        try {
          setParsedJson(JSON.parse(data.output));
        } catch {
          setParsedJson(null);
        }
      } else {
        setError(`Invalid JSON: ${data.error}`);
        setShowAlert(true);
        setParsedJson(null);
      }
    } catch (err) {
      setError("Unable to connect to server.");
      setShowAlert(true);
      setParsedJson(null);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      () => {
        setError("Failed to copy to clipboard");
        setShowAlert(true);
      }
    );
  };

  const handleCopyBase64 = () => {
    navigator.clipboard.writeText(base64Output).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      () => {
        setError("Failed to copy to clipboard");
        setShowAlert(true);
      }
    );
  };

  const handleRestore = (json) => {
    setJsonText(json);
    try {
      setParsedJson(JSON.parse(json));
    } catch {
      setParsedJson(null);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setHistory([]);
  };

  const handleTabChange = (_, newValue) => {
    setTab(newValue);

    // Reset Base64 fields when switching tabs 2 or 3
    if (newValue === 2 || newValue === 3) {
      setBase64Input("");
      setBase64Output("");
    }
  };

  // Base64 handlers
  const handleEncodeBase64 = () => {
    try {
      setBase64Output(btoa(base64Input));
    } catch {
      setBase64Output("Error: Unable to encode");
    }
  };

  const handleDecodeBase64 = () => {
    try {
      // Convert Base64 to byte array
      const bytes = Uint8Array.from(atob(base64Input), (c) => c.charCodeAt(0));
      // Decode UTF-8 bytes
      const decoded = new TextDecoder("utf-8").decode(bytes);
      setBase64Output(decoded);
    } catch {
      setBase64Output("Error: Invalid Base64 string");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        {/* History Drawer */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 240,
              boxSizing: "border-box",
              backgroundColor: "#1e1e1e",
              color: "#ccc",
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">History</Typography>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              fullWidth
              onClick={handleClearHistory}
              sx={{ mt: 1 }}
            >
              Clear History
            </Button>
          </Box>
          <Divider />
          <List dense>
            {history.map((entry) => (
              <ListItem key={entry.id} disablePadding>
                <ListItemButton onClick={() => handleRestore(entry.json)}>
                  <ListItemText
                    primary={`Entry ${new Date(entry.id).toLocaleString()}`}
                    secondary={entry.json.substring(0, 40) + "..."}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {history.length === 0 && (
              <ListItem>
                <ListItemText primary="No history yet." />
              </ListItem>
            )}
          </List>
        </Drawer>

        {/* Main Content */}
        <Container maxWidth="md" sx={{ mt: 6, ml: "260px" }}>
          <Typography variant="h4" gutterBottom>
            JSON & Base64 Toolkit
          </Typography>

          {/* Tabs */}
          <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Raw View" />
            <Tab label="Tree View" />
            <Tab label="Convert to Base64" />
            <Tab label="Decode from Base64" />
          </Tabs>

          {/* JSON Raw View */}
          {tab === 0 && (
            <Box
              sx={{
                height: "500px",
                border: "1px solid #555",
                borderRadius: 2,
              }}
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={jsonText}
                onChange={(value) => setJsonText(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            </Box>
          )}

          {/* JSON Tree View */}
          {tab === 1 && parsedJson && (
            <Box
              sx={{
                p: 2,
                border: "1px solid #555",
                borderRadius: 2,
                bgcolor: "#1e1e1e",
                overflowX: "auto",
                maxHeight: "600px",
              }}
            >
              <ReactJson
                src={parsedJson}
                name={null}
                theme="twilight"
                enableClipboard={false}
                displayDataTypes={false}
                displayObjectSize={false}
                collapsed={1}
              />
            </Box>
          )}
          {tab === 1 && !parsedJson && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cannot display Tree View. The JSON is not valid or empty.
            </Alert>
          )}

          {/* Convert to Base64 */}
          {tab === 2 && (
            <Box>
              <TextField
                label="Enter text to encode"
                multiline
                fullWidth
                minRows={6}
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                margin="normal"
                maxRows={18}
              />
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleEncodeBase64}>
                  Convert to Base64
                </Button>
              </Box>
              {base64Output && (
                <>
                  <TextField
                    label="Base64 Output"
                    multiline
                    fullWidth
                    minRows={6}
                    value={base64Output}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    maxRows={18}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCopyBase64}
                    >
                      Copy
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Decode from Base64 */}
          {tab === 3 && (
            <Box>
              <TextField
                label="Enter Base64 string to decode"
                multiline
                fullWidth
                minRows={6}
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                margin="normal"
                maxRows={18}
              />
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" onClick={handleDecodeBase64}>
                  Decode from Base64
                </Button>
              </Box>
              {base64Output && (
                <>
                  <TextField
                    label="Decoded Output"
                    multiline
                    fullWidth
                    minRows={6}
                    value={base64Output}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    maxRows={18}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCopyBase64}
                    >
                      Copy
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* JSON Buttons */}
          {tab === 0 && (
            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFormat}
              >
                Format JSON
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCopyJson}
              >
                Copy
              </Button>
            </Box>
          )}

          {/* Alerts */}
          <Snackbar
            open={showAlert}
            autoHideDuration={6000}
            onClose={() => setShowAlert(false)}
          >
            <Alert
              severity="error"
              variant="filled"
              onClose={() => setShowAlert(false)}
            >
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={copySuccess}
            autoHideDuration={2000}
            onClose={() => setCopySuccess(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity="success"
              variant="filled"
              onClose={() => setCopySuccess(false)}
            >
              Copied to clipboard!
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
