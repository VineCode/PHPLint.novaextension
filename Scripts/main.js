exports.activate = function() {
    // Do work when the extension is activated
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

class IssuesProvider {    
    runningCodeSniffer(editor) {
        return new Promise(function(resolve) {
            const issues = [];
            
            var path = editor.document.path;

            var execPath = nova.config.get('VineCode.PHPLint.execPath');
            
            if(!execPath) {
              execPath = 'php';
            }                

            const options = {
                args: [
                    execPath,
                    "-l",
                    path
                ]
            };

            const process = new Process("/usr/bin/env", options);

            var stdOut = new Array;
            process.onStdout(function(line) {
              stdOut.push(line.trim());
            });

            process.onDidExit(function() {
                
                // Check if this is OK
                if(stdOut[0].search('No syntax errors') !== -1) {
                    resolve(issues);
                    return false;
                }                
            
                const regex = /line ([0-9]+)$/g;
                const found = regex.exec(stdOut[1]); //stdOut[1].matchAll(regex);

                var message = stdOut[1];
                message = message.replace(path, nova.workspace.relativizePath(path));
  
                let issue = new Issue();
                issue.message = message;
                issue.severity = IssueSeverity.Error; // IssueSeverity.Error : IssueSeverity.Warning;
                issue.line = found[1];
                
                issues.push(issue);  
                
                resolve(issues);
            });

            process.start();
        });
    }

    async provideIssues(editor) {
        return await this.runningCodeSniffer(editor);
    }
}

nova.assistants.registerIssueAssistant("php", new IssuesProvider());
