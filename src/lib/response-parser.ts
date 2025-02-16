export function parseJson(jsonOutput: string): any | null {
    const lines = jsonOutput.split('\n');
    let extractedJson: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '```json') {
            extractedJson = lines.slice(i + 1).join('\n').split('```')[0];
            break;
        }
    }

    if (extractedJson) {
        try {
            return JSON.parse(extractedJson);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return null;
        }
    } else {
        console.log('No JSON block found.');
        return null;
    }
}

export function parseResponse(responses: any[]): string[] {
    const outputText: string[] = [];
    for (const response of responses) {
        const type = response.type;
        if (type === 'check') {
            outputText.push(`Check: ${response.question}`);
        } else if (type === 'description') {
            outputText.push(`Description: ${response.description}`);
        } else if (type === 'inference') {
            outputText.push(`Inference: ${response.inference}`);
        }
    }
    return outputText;
}

export function printStructuredOutput(outputText: string[]): void {
    outputText.forEach(text => console.log(text));
}

export function updateContext(context: string[], outputText: string[]): string[] {
    return context.concat(outputText);
}

export function formAudioOutput(outputText: string[]): string {
    return outputText.join('\n') + '\n';
}
