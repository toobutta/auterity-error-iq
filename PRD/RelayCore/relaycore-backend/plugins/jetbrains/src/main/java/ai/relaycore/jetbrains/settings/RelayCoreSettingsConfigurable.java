package ai.relaycore.jetbrains.settings;

import ai.relaycore.jetbrains.services.RelayCoreSettingsService;
import com.intellij.openapi.options.Configurable;
import com.intellij.openapi.options.ConfigurationException;
import com.intellij.openapi.ui.ComboBox;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBPasswordField;
import com.intellij.ui.components.JBTextField;
import com.intellij.util.ui.FormBuilder;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;
import java.awt.*;

public class RelayCoreSettingsConfigurable implements Configurable {
    private JBPasswordField apiKeyField;
    private JBTextField endpointField;
    private ComboBox<String> modelComboBox;
    private ComboBox<String> providerComboBox;

    private final RelayCoreSettingsService settingsService = RelayCoreSettingsService.getInstance();

    @Nls(capitalization = Nls.Capitalization.Title)
    @Override
    public String getDisplayName() {
        return "RelayCore AI Assistant";
    }

    @Nullable
    @Override
    public JComponent createComponent() {
        apiKeyField = new JBPasswordField();
        endpointField = new JBTextField();
        modelComboBox = new ComboBox<>(new String[]{"gpt-4", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet", "mistral-large", "mistral-small"});
        providerComboBox = new ComboBox<>(new String[]{"openai", "anthropic", "mistral"});

        FormBuilder formBuilder = FormBuilder.createFormBuilder()
                .addLabeledComponent(new JBLabel("API Key:"), apiKeyField, true)
                .addLabeledComponent(new JBLabel("Endpoint:"), endpointField, true)
                .addLabeledComponent(new JBLabel("Model:"), modelComboBox, true)
                .addLabeledComponent(new JBLabel("Provider:"), providerComboBox, true);

        JPanel mainPanel = formBuilder.addComponentFillVertically(new JPanel(), 0).getPanel();
        mainPanel.setPreferredSize(new Dimension(400, 200));

        reset();

        return mainPanel;
    }

    @Override
    public boolean isModified() {
        String currentApiKey = new String(apiKeyField.getPassword());
        String currentEndpoint = endpointField.getText();
        String currentModel = (String) modelComboBox.getSelectedItem();
        String currentProvider = (String) providerComboBox.getSelectedItem();

        return !currentApiKey.equals(settingsService.getApiKey()) ||
                !currentEndpoint.equals(settingsService.getEndpoint()) ||
                !currentModel.equals(settingsService.getModel()) ||
                !currentProvider.equals(settingsService.getProvider());
    }

    @Override
    public void apply() throws ConfigurationException {
        String apiKey = new String(apiKeyField.getPassword());
        if (apiKey.isEmpty()) {
            throw new ConfigurationException("API Key cannot be empty");
        }

        String endpoint = endpointField.getText();
        if (endpoint.isEmpty()) {
            throw new ConfigurationException("Endpoint cannot be empty");
        }

        settingsService.setApiKey(apiKey);
        settingsService.setEndpoint(endpoint);
        settingsService.setModel((String) modelComboBox.getSelectedItem());
        settingsService.setProvider((String) providerComboBox.getSelectedItem());
    }

    @Override
    public void reset() {
        apiKeyField.setText(settingsService.getApiKey());
        endpointField.setText(settingsService.getEndpoint());
        modelComboBox.setSelectedItem(settingsService.getModel());
        providerComboBox.setSelectedItem(settingsService.getProvider());
    }

    @Nullable
    @Override
    public JComponent getPreferredFocusedComponent() {
        return apiKeyField;
    }
}