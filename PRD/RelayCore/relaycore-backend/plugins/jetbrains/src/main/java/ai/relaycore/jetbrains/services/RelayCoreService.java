package ai.relaycore.jetbrains.services;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.diagnostic.Logger;
import com.intellij.openapi.progress.ProgressIndicator;
import com.intellij.openapi.progress.ProgressManager;
import com.intellij.openapi.progress.Task;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Service
public final class RelayCoreService {
    private static final Logger LOG = Logger.getInstance(RelayCoreService.class);

    public static RelayCoreService getInstance() {
        return ApplicationManager.getApplication().getService(RelayCoreService.class);
    }

    private final RelayCoreSettingsService settingsService = RelayCoreSettingsService.getInstance();

    /**
     * Sends a request to the RelayCore API to explain the given code.
     *
     * @param code     The code to explain
     * @param language The programming language of the code
     * @param callback Callback to handle the response
     */
    public void explainCode(String code, String language, Consumer<String> callback) {
        String systemPrompt = "You are a helpful coding assistant. Explain the following " + language + " code in a clear and concise manner.";
        String userPrompt = code;

        sendChatRequest(systemPrompt, userPrompt, callback);
    }

    /**
     * Sends a request to the RelayCore API to generate documentation for the given code.
     *
     * @param code     The code to document
     * @param language The programming language of the code
     * @param callback Callback to handle the response
     */
    public void generateDocumentation(String code, String language, Consumer<String> callback) {
        String systemPrompt = "You are a documentation expert. Generate comprehensive documentation for the following " + language + " code.";
        String userPrompt = code;

        sendChatRequest(systemPrompt, userPrompt, callback);
    }

    /**
     * Sends a request to the RelayCore API to optimize the given code.
     *
     * @param code     The code to optimize
     * @param language The programming language of the code
     * @param callback Callback to handle the response
     */
    public void optimizeCode(String code, String language, Consumer<String> callback) {
        String systemPrompt = "You are a code optimization expert. Optimize the following " + language + " code for better performance and readability. Return only the optimized code without explanations.";
        String userPrompt = code;

        sendChatRequest(systemPrompt, userPrompt, callback);
    }

    /**
     * Sends a request to the RelayCore API to answer a question about the given code.
     *
     * @param code     The code to ask about
     * @param question The question to ask
     * @param language The programming language of the code
     * @param callback Callback to handle the response
     */
    public void askQuestion(String code, String question, String language, Consumer<String> callback) {
        String systemPrompt = "You are a helpful coding assistant. Answer questions about the provided " + language + " code.";
        String userPrompt = "Code:\n```\n" + code + "\n```\n\nQuestion: " + question;

        sendChatRequest(systemPrompt, userPrompt, callback);
    }

    /**
     * Sends a chat request to the RelayCore API.
     *
     * @param systemPrompt The system prompt
     * @param userPrompt   The user prompt
     * @param callback     Callback to handle the response
     */
    private void sendChatRequest(String systemPrompt, String userPrompt, Consumer<String> callback) {
        ProgressManager.getInstance().run(new Task.Backgroundable(null, "RelayCore AI", false) {
            @Override
            public void run(@NotNull ProgressIndicator indicator) {
                indicator.setIndeterminate(true);
                indicator.setText("Sending request to RelayCore...");

                try {
                    String response = makeApiRequest(systemPrompt, userPrompt);
                    ApplicationManager.getApplication().invokeLater(() -> callback.accept(response));
                } catch (Exception e) {
                    LOG.error("Error sending request to RelayCore", e);
                    ApplicationManager.getApplication().invokeLater(() -> callback.accept("Error: " + e.getMessage()));
                }
            }
        });
    }

    /**
     * Makes an API request to the RelayCore API.
     *
     * @param systemPrompt The system prompt
     * @param userPrompt   The user prompt
     * @return The response from the API
     * @throws IOException If an I/O error occurs
     */
    private String makeApiRequest(String systemPrompt, String userPrompt) throws IOException {
        String apiKey = settingsService.getApiKey();
        String endpoint = settingsService.getEndpoint();
        String model = settingsService.getModel();
        String provider = settingsService.getProvider();

        if (apiKey == null || apiKey.isEmpty()) {
            return "Error: API key not configured. Please configure your RelayCore API key in the settings.";
        }

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(endpoint + "/v1/chat/completions");
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Authorization", "Bearer " + apiKey);

            JSONObject requestBody = new JSONObject();
            requestBody.put("model", model);
            
            if (provider != null && !provider.isEmpty()) {
                requestBody.put("provider", provider);
            }
            
            JSONArray messages = new JSONArray();
            
            JSONObject systemMessage = new JSONObject();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            messages.put(systemMessage);
            
            JSONObject userMessage = new JSONObject();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);
            messages.put(userMessage);
            
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            
            httpPost.setEntity(new StringEntity(requestBody.toString(), StandardCharsets.UTF_8));

            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                HttpEntity entity = response.getEntity();
                if (entity != null) {
                    String responseString = EntityUtils.toString(entity);
                    JSONObject jsonResponse = new JSONObject(responseString);
                    
                    if (jsonResponse.has("error")) {
                        return "Error: " + jsonResponse.getJSONObject("error").getString("message");
                    }
                    
                    return jsonResponse.getJSONArray("choices")
                            .getJSONObject(0)
                            .getJSONObject("message")
                            .getString("content");
                }
                
                return "Error: No response from API";
            }
        }
    }
}