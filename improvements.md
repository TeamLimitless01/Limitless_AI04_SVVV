# Interview Page and Feature Improvements

This document tracks improvements for the interview experience, reports, and related features. Items marked completed or implemented are available; unmarked items are recommendations.

## Highest priority

### 1. Make interview start and device setup clearer — Completed

- The launch dialog starts an audio interview and checks microphone permission before connecting.
- Microphone errors explain how to resolve permission, missing-device, and device-in-use problems.
- Camera permission is requested only after the candidate enables the camera during the interview.
- The launch dialog explains that audio is streamed, the transcript is used for the report, and camera presence is not used for scoring.

### 2. Improve interview completion and report reliability

- Ask for confirmation before ending an interview early, and distinguish ending early from the timer expiring.
- Save the transcript incrementally so a refresh, browser crash, or connection loss does not erase the session.
- Make report generation idempotent so repeated clicks or retries cannot create conflicting reports.
- Validate the generated report against a runtime schema before saving or displaying it; show a retry path if the model returns invalid data.
- Preserve the interview and transcript if report generation fails, and allow report generation to be retried later.
- Show report-generation progress and a specific error state instead of relying only on a toast.

### 3. Make interruption handling fair and understandable

- Replace immediate termination on tab visibility changes with a configurable warning policy.
- Do not count normal browser or operating-system interactions as misconduct without clear candidate notice.
- Separate focus-loss events from confirmed tab switching and present a transparent summary.
- Allow interview owners to configure whether focus monitoring is enabled.

## Interview experience

### 4. Add flexible interview controls

- Keep the interview audio-only for now; restore text mode only after its interview, transcript, and report flows are verified end to end.
- Add controls for response speed, question difficulty, and interview length.
- Let candidates repeat, skip, or ask for clarification on a question, with configurable limits.
- Offer pause/resume behavior that pauses the timer and clearly indicates whether audio capture remains active.
- Add a keyboard shortcut reference and confirm destructive actions such as ending the interview.

### 5. Make transcript and progress more useful

- Add timestamps and clear speaker labels to transcript messages.
- Support searching, copying, and exporting the transcript.
- Track question completion and answered topics without presenting unsupported behavioral or personality scores.
- Make the panel usable on mobile with a deliberate open/close control and accessible focus management.
- Offer captions that can be resized and remain readable against the interview background.

### 6. Improve accessibility and responsive behavior

- Verify full keyboard operation for microphone, camera, captions, sidebar, and report controls.
- Add visible focus styles, descriptive accessible names, and live announcements for connection and recording state.
- Respect reduced-motion preferences for animations.
- Test narrow screens, browser zoom, high-contrast settings, and screen readers.

## AI and speech quality

### 7. Make the interview more adaptive

- Ground follow-up questions in the candidate's actual answers and selected skills.
- Track which requested skills have been assessed, and avoid repeating questions.
- Let candidates know when the AI is listening, processing, speaking, or disconnected.
- Detect audio connection failures and offer a safe reconnect path without losing the transcript.
- Keep conversation context bounded with periodic summaries for longer sessions.

### 8. Improve speech robustness

- Handle microphone permission changes, device removal, and network interruptions during a session.
- Provide a clear audio-level check before starting and a mute state that matches the actual audio capture state.
- Test speech recognition and playback across supported browsers and languages.

## Reports and progress

### 9. Keep evaluations evidence-based — Rubric v1.0 implemented

- The report uses the following matrix so scores are derived from observable answer evidence, not free-form overall impressions:

| Metric | Weight | What to assess |
|---|---:|---|
| Role knowledge and application | 40% | Correctness and relevance of role-specific concepts; adapt this criterion to the interview role rather than assuming every interview is technical. |
| Reasoning and problem solving | 35% | Whether the candidate explains a coherent approach, considers constraints, and supports decisions with relevant reasoning. |
| Communication and clarity | 25% | Whether answers are understandable, organized, and sufficiently specific to evaluate. Do not score accent, fluency as a personality proxy, or confidence. |

- Metrics use an anchored scale: Not assessed = insufficient answer evidence; 0 = an assessable answer with no correct or relevant content; 1 = mostly incorrect or unsupported, but with limited relevant content; 2 = partially correct with material gaps; 3 = substantially correct and sufficiently reasoned; 4 = accurate, relevant, and well-supported. Unasked or unanswered competencies are not scored.
- Each numeric rating must cite at least one exact transcript excerpt and its message reference. The report endpoint verifies that citations occur in candidate messages and rejects unsupported or unmatched evidence.
- Metric scores are converted from 0–4 to 0–10 by multiplying by 2.5. The overall score is calculated in code, not by the model: `(role knowledge × 0.40 + reasoning × 0.35 + communication × 0.25) × 2.5`, rounded to one decimal on a 0–10 scale. Per-metric ratings and evidence are included in the report for auditing.
- Metrics with insufficient evidence are marked “Not assessed”; no guessed score is substituted. Evidence coverage is shown, and an overall score is omitted unless every metric has assessable evidence.
- The endpoint validates score ranges, scorecard fields, and evidence references before returning a report; validation failures are shown to the candidate and are not saved.
- The report UI displays the rubric ratings, evidence excerpts, and coverage; it hides the overall score and radar when evidence is incomplete.
- The dashboard excludes unscored reports from averages and presents recent scores without turning them into hiring recommendations.

Remaining improvements:
- Validate every generated narrative claim against cited transcript evidence, and link each strength, improvement area, and next step to its supporting answer.
- Add a clear AI-generated label, explain the score scale, and let candidates flag report inaccuracies and request regeneration after correcting details.

### 10. Make reports actionable

- Link each recommendation to the relevant answer or question.
- Include example practice exercises tied to the candidate's identified gaps.
- Allow downloading or sharing a report with candidate-controlled privacy settings.
- Show trend charts only when there is enough comparable interview data; explain the sample size.
- Keep dashboard categories consistent with the report schema as it evolves.

## Privacy, reliability, and performance

### 11. Make data handling transparent

- Document what transcript, audio, and camera data are processed, retained, and shared.
- Keep camera detection local where possible and never include camera-derived metrics in reports unless a future feature is explicitly opt-in and validated.
- Provide clear retention and deletion controls for interviews and reports.
- Avoid sending unnecessary personal data to report-generation services.

### 12. Strengthen operational reliability

- Add automated tests for audio interview start, device permissions, sidebar/captions state, early ending, timer expiry, and report retry.
- Add end-to-end tests for camera-off sessions to verify that no camera stream starts and no camera data reaches report generation.
- Monitor connection failures and report-generation errors without logging transcript contents or secrets.
- Add request timeouts, bounded retries, and clear user feedback for network and AI-provider failures.
- Measure startup time, response latency, and reconnect success to guide optimization.

## Suggested delivery order

1. Update the launch and device-permission UX; test audio-only and camera-off flows.
2. Make report generation validated, retryable, and protected against duplicate requests.
3. Make focus/interruption handling transparent and configurable.
4. Add transcript persistence and reconnect recovery.
5. Improve accessibility, mobile panel behavior, and end-to-end coverage.
6. Add evidence-linked reports and adaptive question coverage.
