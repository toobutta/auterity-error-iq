package ai.relaycore.jetbrains.services;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.*;
import com.intellij.util.xmlb.XmlSerializerUtil;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

@Service
@State(
        name = "ai.relaycore.jetbrains.services.RelayCoreSettingsService",
        storages = @Storage("RelayCoreSettings.xml")
)
public class RelayCoreSettingsService implements PersistentStateComponent<RelayCoreSettingsService> {
    private String apiKey = "";
    private String endpoint = "http://localhost:3000";
    private String model = "gpt-4";
    private String provider = "openai";

    public static RelayCoreSettingsService getInstance() {
        return ApplicationManager.getApplication().getService(RelayCoreSettingsService.class);
    }

    @Nullable
    @Override
    public RelayCoreSettingsService getState() {
        return this;
    }

    @Override
    public void loadState(@NotNull RelayCoreSettingsService state) {
        XmlSerializerUtil.copyBean(state, this);
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}