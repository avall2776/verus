const fs = require('fs');
const readline = require('readline');

async function findDbUrl() {
  const fileStream = fs.createReadStream('C:\\Users\\Usuario\\.gemini\\antigravity-ide\\brain\\fc842083-ab25-488b-adb1-dac770400bae\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'USER_INPUT' || parsed.source === 'USER_EXPLICIT') {
        const content = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
        if (content.toLowerCase().includes('postgresql') || content.toLowerCase().includes('database_url')) {
          console.log('FOUND:', content);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }
}

findDbUrl();
