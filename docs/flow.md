# SRTT App Flow

## Architecture

1. Frontend: Vite + React single page app
2. State Management: Context API (no Redux)
3. Data Flow: Frontend → Local backend for processing translations

## Core Components

1. `App.jsx` - Main layout wrapper
2. `FileUploader.jsx` - SRT file upload component
3. `SubtitleDisplay.jsx` - Display and edit subtitles
4. `TranslationOptions.jsx` - Select target language
5. `ExportOptions.jsx` - Export settings
6. `Footer.jsx` - App information

## Detailed Flow

1. User lands on single page with file upload area prominent
2. User uploads SRT file through drag-drop or file picker
3. System parses SRT file into structured data object
4. System displays parsed subtitles in editable format
5. User selects target language from dropdown
6. User initiates translation process
7. System sends SRT data to local backend
8. Backend processes translation request
9. Translation results return to frontend
10. System displays translated subtitles
11. User can manually edit any subtitle text
12. User configures export settings (filename, encoding)
13. User exports translated SRT file
14. System generates downloadable SRT file

## State Management

15. Create `SubtitleContext.jsx` to manage global state
16. Store original SRT content in context
17. Store parsed subtitle objects in context
18. Store selected target language in context
19. Store translation results in context
20. Store UI state (loading, errors) in context
21. Store batch translation settings in context (min/max lines per batch)

## Data Structure

22. Parse SRT into array of objects: `[{id, startTime, endTime, text, translated: null}]`
23. Detect sentence boundaries for optimal translation batching
24. Group subtitles into translation batches (configurable 5-10 lines)
25. Track original and translated versions in the same object structure
26. Maintain timing information unchanged during translation

## Batch Translation Processing

27. Allow user to configure batch size (min 5, max 10 lines per request)
28. Process translation in optimized batches for better translation quality
29. Show progress indicators for each batch during translation
30. Enable pause/resume functionality for batch translation process
31. Implement intelligent sentence boundary detection for batching

## Error Handling

32. Validate SRT file format on upload
33. Show clear error messages for invalid files
34. Handle network errors during translation
35. Implement retry mechanism for failed translation batches
36. Validate subtitle text format before export
37. Track and report batch-specific translation errors

## Feature Details

38. Implement batch translation to handle large files
39. Add character count and timing information display
40. Allow manual adjustment of timing if needed
41. Implement progress indicator during translation
42. Cache translations to reduce redundant API calls
43. Support multiple file exports in one session
44. Implement auto-save of work in progress
45. Allow importing partially translated SRT files
46. Provide simple text formatting controls
47. Support export in various encodings (UTF-8, etc.)

## UI/UX Considerations

48. Implement responsive design for all screen sizes
49. Use clear visual indicators during processing
50. Implement keyboard shortcuts for common actions
51. Provide confirmation before overwriting existing work
52. Include tooltip help for complex features
53. Implement dark/light mode toggle
54. Display batch translation progress clearly

## Backend Integration

55. Create local API endpoint for batch translation requests
56. Structure API requests with appropriate headers
57. Implement rate limiting for translation service
58. Cache translation results to minimize API calls
59. Log translation requests for debugging
60. Support configurable batch sizes in backend API

## Additional Rules

61. Implement subtitle search functionality to easily find and edit specific entries
62. Add ability to merge consecutive subtitles with similar timing
63. Include subtitle character limit warnings based on readability standards
64. Create a preview mode to simulate how subtitles will appear on video
65. Implement a session history feature to recover from accidental actions
66. Add support for batch editing of multiple subtitle entries
67. Enable custom translation memory/glossary for consistent terminology
68. Implement an undo/redo system for edit operations
69. Add spellcheck functionality for translated text
70. Implement export format compatibility checking

## Performance Optimization

71. Use virtualized lists for rendering large subtitle files
72. Implement lazy loading of translation services
73. Add debouncing for auto-save and translation requests
74. Optimize parsing algorithm for large SRT files
75. Implement web workers for heavy processing tasks
76. Optimize batch size dynamically based on performance metrics

## Accessibility

77. Ensure keyboard navigation throughout the entire application
78. Implement ARIA attributes for screen reader compatibility
79. Provide high contrast mode for visually impaired users
80. Support font size adjustment for better readability
81. Add proper focus management for interactive elements

## Security and Privacy

82. Implement local processing when possible to minimize data transmission
83. Add data sanitization for all user inputs
84. Implement proper error boundaries to prevent app crashes
85. Store sensitive API keys securely in environment variables
86. Clear application cache and local storage on user request
