package ai.relaycore.jetbrains.toolWindow;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;

public class RelayCoreToolWindowFactory implements ToolWindowFactory {
    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        RelayCoreToolWindowContent toolWindowContent = new RelayCoreToolWindowContent(project);
        Content content = ContentFactory.getInstance().createContent(
                toolWindowContent.getContentPanel(), "RelayCore", false);
        toolWindow.getContentManager().addContent(content);
    }

    private static class RelayCoreToolWindowContent {
        private final JPanel contentPanel;

        public RelayCoreToolWindowContent(Project project) {
            contentPanel = new JPanel(new BorderLayout());
            
            JTextArea welcomeText = new JTextArea();
            welcomeText.setEditable(false);
            welcomeText.setLineWrap(true);
            welcomeText.setWrapStyleWord(true);
            welcomeText.setText(
                    "Welcome to RelayCore AI Assistant!\n\n" +
                    "To use RelayCore:\n" +
                    "1. Select code in the editor\n" +
                    "2. Right-click and choose an option from the RelayCore menu\n" +
                    "3. Results will appear in this tool window\n\n" +
                    "Available actions:\n" +
                    "- Explain Selected Code\n" +
                    "- Generate Documentation\n" +
                    "- Optimize Code\n" +
                    "- Ask Question About Code\n\n" +
                    "Make sure you've configured your RelayCore API key in Settings > Tools > RelayCore AI Assistant."
            );
            
            JScrollPane scrollPane = new JScrollPane(welcomeText);
            contentPanel.add(scrollPane, BorderLayout.CENTER);
        }

        public JPanel getContentPanel() {
            return contentPanel;
        }
    }
}