package ai.relaycore.jetbrains.actions;

import ai.relaycore.jetbrains.services.RelayCoreService;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.SelectionModel;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileTypes.FileType;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowManager;
import com.intellij.psi.PsiFile;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;

public class ExplainCodeAction extends AnAction {
    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        if (project == null) {
            return;
        }

        Editor editor = e.getData(CommonDataKeys.EDITOR);
        if (editor == null) {
            return;
        }

        SelectionModel selectionModel = editor.getSelectionModel();
        if (!selectionModel.hasSelection()) {
            Messages.showWarningDialog(project, "Please select some code to explain.", "No Code Selected");
            return;
        }

        String selectedText = selectionModel.getSelectedText();
        if (selectedText == null || selectedText.isEmpty()) {
            return;
        }

        PsiFile psiFile = e.getData(CommonDataKeys.PSI_FILE);
        String language = "code";
        if (psiFile != null) {
            FileType fileType = psiFile.getFileType();
            language = fileType.getName().toLowerCase();
        }

        // Create or activate the tool window
        ToolWindow toolWindow = ToolWindowManager.getInstance(project).getToolWindow("RelayCore");
        if (toolWindow == null) {
            Messages.showErrorDialog(project, "RelayCore tool window not found.", "Error");
            return;
        }

        toolWindow.show(() -> {
            // Create a panel to display the results
            JPanel panel = new JPanel(new BorderLayout());
            JTextArea resultArea = new JTextArea();
            resultArea.setEditable(false);
            resultArea.setLineWrap(true);
            resultArea.setWrapStyleWord(true);
            resultArea.setText("Explaining code...");
            
            JScrollPane scrollPane = new JScrollPane(resultArea);
            panel.add(scrollPane, BorderLayout.CENTER);

            // Add the panel to the tool window
            ContentFactory contentFactory = ContentFactory.getInstance();
            Content content = contentFactory.createContent(panel, "Code Explanation", false);
            toolWindow.getContentManager().addContent(content);
            toolWindow.getContentManager().setSelectedContent(content);

            // Send the request to the RelayCore service
            RelayCoreService.getInstance().explainCode(selectedText, language, response -> {
                resultArea.setText(response);
            });
        });
    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        Editor editor = e.getData(CommonDataKeys.EDITOR);
        
        e.getPresentation().setEnabledAndVisible(
                project != null && 
                editor != null && 
                editor.getSelectionModel().hasSelection()
        );
    }
}