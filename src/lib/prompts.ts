export function buildXPostPrompt(articleContent: string, customPrompt = 'None') {
  return `You are an expert at converting long technical articles into concise, engaging X (Twitter) threads.

Your task is to read the entire article provided by the user and transform it into:

1. ONE HOOK POST
2. A SHORT FOLLOWING THREAD

The goal is NOT to summarize every sentence. Extract the most important ideas and explain them as a short, easy-to-follow story.

━━━━━━━━━━━━━━━━━━━━
HOOK FORMAT
━━━━━━━━━━━━━━━━━━━━

Start with a strong curiosity-driven hook.

The hook should:
- Usually begin with a personal realization, mistake, problem, or surprising observation.
- Create curiosity about the technical concept.
- Make the reader want to continue reading.
- Clearly introduce the main topic.
- Feel natural and conversational.
- Avoid sounding like a textbook or marketing copy.

Preferred structure:

"I thought [common assumption].

Then I discovered/experienced [surprising problem].

That made me ask:

"[interesting question]"

That's when I started understanding [topic]. 🧵"

Do NOT always copy this exact structure. Adapt it naturally to the article.

The hook should be concise.

━━━━━━━━━━━━━━━━━━━━
THREAD FORMAT
━━━━━━━━━━━━━━━━━━━━

After the hook, create a numbered thread:

1/7
2/7
3/7
...

The number of tweets should depend on the complexity of the article.

Prefer SHORT threads.

Usually aim for 6–10 tweets.

Do NOT create unnecessary tweets just to cover every detail.

Each tweet must contain one clear idea.

━━━━━━━━━━━━━━━━━━━━
STRICT CHARACTER LIMIT
━━━━━━━━━━━━━━━━━━━━

EVERY SINGLE TWEET MUST BE UNDER 280 CHARACTERS.

This includes:
- The tweet number (e.g. 1/8)
- Spaces
- Punctuation
- Emojis
- Markdown characters

Never exceed 280 characters.

Prefer keeping tweets comfortably below the limit rather than trying to reach 280 exactly.

━━━━━━━━━━━━━━━━━━━━
WRITING STYLE
━━━━━━━━━━━━━━━━━━━━

Use:
- Simple English
- Conversational language
- Short sentences
- Clear explanations
- Natural storytelling
- Technical accuracy

Avoid:
- Academic language
- Corporate language
- Excessive explanation
- Long paragraphs
- Unnecessary filler
- Repeating the same idea
- Overly dramatic claims
- Marketing-style language

The thread should feel like a developer sharing something they genuinely learned.

━━━━━━━━━━━━━━━━━━━━
STORY STRUCTURE
━━━━━━━━━━━━━━━━━━━━

Whenever possible, structure the thread like this:

1. Hook / problem
2. Initial assumption
3. Discovery
4. Explanation of the concept
5. Important distinction
6. Deeper problem or realization
7. Practical implication
8. Final mental model / takeaway

Do not force this structure if the article naturally follows another progression.

The thread should have a logical flow where each tweet naturally leads to the next.

━━━━━━━━━━━━━━━━━━━━
TECHNICAL ACCURACY
━━━━━━━━━━━━━━━━━━━━

Do not blindly copy technically incorrect statements from the article.

If necessary:
- Correct inaccurate terminology.
- Remove misleading claims.
- Simplify without changing the meaning.
- Avoid overclaiming.

Do not introduce unrelated concepts that are not necessary for understanding the article.

━━━━━━━━━━━━━━━━━━━━
EXAMPLES
━━━━━━━━━━━━━━━━━━━━

Use examples only when they make the concept significantly easier to understand.

Do NOT use code snippets, diagrams, ASCII graphs, or technical flows unless the user explicitly asks for them.

When the user asks for plain-text tweets, keep everything in normal prose.

━━━━━━━━━━━━━━━━━━━━
ENDING
━━━━━━━━━━━━━━━━━━━━

The final tweet should usually provide a concise mental model, lesson, or takeaway.

For example:

"The important distinction I learned was:

Training → changes what the model learns.
RAG → gives the model information when it needs it.

They aren't replacements for each other.
They solve different problems."

Do not force a question or CTA at the end unless it naturally fits the topic.

━━━━━━━━━━━━━━━━━━━━
IMPORTANT RULES
━━━━━━━━━━━━━━━━━━━━

1. Never exceed 280 characters in ANY tweet.
2. Keep the thread short and precise.
3. Do not over-explain.
4. Do not turn every paragraph of the article into a tweet.
5. Remove redundant information.
6. Preserve the author's personal learning journey when present.
7. Maintain technical accuracy.
8. Make the thread understandable even to someone who is familiar with programming but doesn't know the specific concept.
9. Don't make the writing sound AI-generated.
10. Prefer clarity over completeness.
11. Do not add unnecessary emojis. Use 🧵 in the hook and occasional emojis only when they naturally fit.
12. Do not use code snippets, graphs, diagrams, or flows unless explicitly requested.
13. Before finalizing, internally verify the character count of EVERY tweet.
14. If a tweet exceeds 280 characters, rewrite it until it is safely under the limit.

━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━

Return only this structure in plain text (DO NOT use any markdown formatting like asterisks or hashes):

Hook:
[Hook tweet]

Thread:

1/N
[Tweet]

2/N
[Tweet]

...

N/N
[Final tweet]

Do not provide explanations, analysis, character counts, or alternative versions unless the user asks for them.

━━━━━━━━━━━━━━━━━━━━
INPUT DATA
━━━━━━━━━━━━━━━━━━━━
Additional instructions from user (if any): ${customPrompt}

Article Data:
${articleContent}`;
}

export function buildVideoPrompt(articleContent: string, customPrompt = 'None') {
  return `Based on the following article, generate a detailed video prompt and script outline for a short-form video (TikTok, Reels, Shorts) or a YouTube video. Include visual cues and voiceover lines. 

IMPORTANT: Do NOT use any markdown formatting (no bolding, italics, or hashes). Return plain, copy-pasteable text only.

Additional instructions from user (if any): ${customPrompt}

Article Data:
${articleContent}`;
}

export const VIDEO_APPEND_STRING = `\n\nFormat: 9:16 vertical animated video, 15–20 seconds duration.
Style: Clean flat-design 2.5D vector illustration, modern tech aesthetic, vibrant minimalist color palette on a neutral dark/light slate background. Bold outlines, smooth motion graphics, isometric perspective.

Subject / Scene Breakdown:
- 00:00–00:04 (The Trigger): Large, distinct isometric graphic representing [Client Device / Incoming Request]. [Action: emits a glowing data packet moving along an animated pathway].
- 00:04–00:10 (The Core Mechanism): The packet enters [Central Component: e.g., Middleware / Rate Limiter / Gateway]. Visual mechanism activates [e.g., counter increments / security shield scans / token bucket fills or drops]. Clear, prominent visual cue: [e.g., green checkmark for pass, smooth red deflection for block].
- 00:10–00:15 (The Destination): Allowed packet flows seamlessly into [Target: e.g., Backend Server Cluster / Database node]. The target component pulses with a gentle glow and returns an instant response payload back along the line.

Text & UI Constraints:
- Minimal text. Max 1–2 bold floating labels (e.g., "[LABEL 1]", "[LABEL 2]").
- No complex terminal dumps or paragraphs; rely entirely on visual metaphors and motion flow.

Camera & Motion:
- Fixed isometric angle with a subtle push-in toward the central component during the evaluation phase.
- Snappy, high-frame-rate easing curves (ease-in-out) for all component movements.

Audio & SFX Cues:
- Soft digital whoosh on packet dispatch.
- Crisp UI click / chime during component processing.
- Low resonant hum for server/database acknowledgment.`;
