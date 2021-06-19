# Glossary

Glossary is a docs utilitary library which goal is to help newcomers to understand your explanations easier _without leaving your content_.
Whenever you bring information, you use jargons; new words that require people to pause their readings to look for definitions on their search engines. 

Breaking the reading is a source of distraction and is nice neither for readers nor for authors.

Glossary is a simple way to bring explicitness with parcymony.

## How it Works:

Register a list of words with their definitions

```js
import { glossarize } from "glossary";

const glossary = glossarize([
  {
    match: "jargons?", // Match a regex
    definition: `A jargon is a group of words that live in a specific context, e.g. "scientific jargon".`
  },
  {
    match: "rich text", 
    definition: `
      You may use <strong>HTML</strong> in your definitions. 
    `
  },
  {
    match: "promises",
    definition: new Promise((resolve) => resolve(`Promises can be resolved, allowing use of asynchronous data`))
  },
  {
    match: "functions",
    definition: () => `Definitions may also be defined as functions returning a string.`
  }
]);

glossary.apply(); // Default layout

glossary.apply({
  type: "underline"
});
```

You may use Markdown in your definitions but for performance sake, we recommend to compile it in a separate step.

Enable it on specific pages

Customize the layout

