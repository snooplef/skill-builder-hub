-- Seed categories for all topics
INSERT INTO public.categories (id, topic_id, name) VALUES
-- React categories
('11111111-0001-0001-0001-000000000001', 'react', 'Hooks'),
('11111111-0001-0001-0001-000000000002', 'react', 'Components'),
('11111111-0001-0001-0001-000000000003', 'react', 'State Management'),
-- JavaScript categories
('11111111-0002-0001-0001-000000000001', 'javascript', 'Async'),
('11111111-0002-0001-0001-000000000002', 'javascript', 'Closures'),
('11111111-0002-0001-0001-000000000003', 'javascript', 'ES6+'),
-- CSS categories
('11111111-0003-0001-0001-000000000001', 'css', 'Flexbox'),
('11111111-0003-0001-0001-000000000002', 'css', 'Grid'),
('11111111-0003-0001-0001-000000000003', 'css', 'Selectors'),
-- HTML categories
('11111111-0004-0001-0001-000000000001', 'html', 'Semantic HTML'),
('11111111-0004-0001-0001-000000000002', 'html', 'Forms'),
('11111111-0004-0001-0001-000000000003', 'html', 'Accessibility')
ON CONFLICT (topic_id, name) DO NOTHING;

-- Seed React Questions (10)
INSERT INTO public.questions (id, topic_id, category_id, type, prompt, choices, correct_choice_index, answer, explanation, difficulty) VALUES
('react-q-001', 'react', '11111111-0001-0001-0001-000000000001', 'mcq', 'What does useEffect run after by default?', '["Every render", "Only on mount", "Only on unmount", "Only on state updates"]', 0, NULL, 'Without a dependency array, useEffect runs after every render.', 2),
('react-q-002', 'react', '11111111-0001-0001-0001-000000000001', 'mcq', 'What hook would you use to store a mutable value that does not trigger a re-render?', '["useState", "useRef", "useMemo", "useCallback"]', 1, NULL, 'useRef returns a mutable ref object that persists across renders without causing re-renders.', 2),
('react-q-003', 'react', '11111111-0001-0001-0001-000000000001', 'open', 'Explain when you would use useMemo vs useCallback.', NULL, NULL, 'useMemo memoizes a computed value, while useCallback memoizes a function reference. Use useMemo for expensive calculations and useCallback for functions passed to optimized child components.', 'Both help prevent unnecessary recomputation when dependencies have not changed.', 3),
('react-q-004', 'react', '11111111-0001-0001-0001-000000000002', 'mcq', 'What is the primary purpose of React.memo?', '["Memoize expensive calculations", "Prevent unnecessary re-renders of functional components", "Create memoized callbacks", "Store values between renders"]', 1, NULL, 'React.memo is a higher-order component that memoizes functional components to prevent re-renders when props have not changed.', 2),
('react-q-005', 'react', '11111111-0001-0001-0001-000000000002', 'mcq', 'What is the correct way to pass data from parent to child in React?', '["Context API", "Props", "State lifting", "Redux"]', 1, NULL, 'Props are the standard way to pass data from a parent component to a child component.', 1),
('react-q-006', 'react', '11111111-0001-0001-0001-000000000002', 'open', 'What is the difference between controlled and uncontrolled components?', NULL, NULL, 'Controlled components have their form data managed by React state, while uncontrolled components store form data in the DOM itself, accessed via refs.', 'Controlled components are preferred for most use cases as they give you more control over the form behavior.', 2),
('react-q-007', 'react', '11111111-0001-0001-0001-000000000003', 'mcq', 'When should you consider using useReducer over useState?', '["For simple boolean toggles", "When next state depends on previous state with complex logic", "For storing primitive values", "Never, always use useState"]', 1, NULL, 'useReducer is preferable when you have complex state logic involving multiple sub-values or when the next state depends on the previous one.', 3),
('react-q-008', 'react', '11111111-0001-0001-0001-000000000003', 'mcq', 'What problem does the Context API solve?', '["Prop drilling", "State persistence", "Component styling", "Event handling"]', 0, NULL, 'Context API solves prop drilling by allowing you to share values between components without passing props through every level.', 2),
('react-q-009', 'react', '11111111-0001-0001-0001-000000000001', 'mcq', 'What is the purpose of the dependency array in useEffect?', '["To list variables used inside the effect", "To control when the effect runs", "To optimize performance", "All of the above"]', 3, NULL, 'The dependency array controls when the effect runs, lists variables it depends on, and helps optimize by preventing unnecessary effect executions.', 2),
('react-q-010', 'react', '11111111-0001-0001-0001-000000000002', 'open', 'What are React fragments and when would you use them?', NULL, NULL, 'React fragments (<></> or <Fragment>) let you group multiple children without adding extra nodes to the DOM. Use them when you need to return multiple elements from a component but don''t want a wrapper div.', 'Fragments are useful for keeping the DOM clean and avoiding unnecessary wrapper elements.', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed JavaScript Questions (10)
INSERT INTO public.questions (id, topic_id, category_id, type, prompt, choices, correct_choice_index, answer, explanation, difficulty) VALUES
('js-q-001', 'javascript', '11111111-0002-0001-0001-000000000001', 'mcq', 'What is the event loop responsible for?', '["Managing CSS animations", "Coordinating the call stack and callback queue", "Handling DOM events only", "Compiling JavaScript"]', 1, NULL, 'The event loop monitors the call stack and callback queue, pushing callbacks to the stack when it is empty.', 3),
('js-q-002', 'javascript', '11111111-0002-0001-0001-000000000001', 'mcq', 'What does Promise.all() return if one promise rejects?', '["An array of all results", "The first resolved value", "A rejected promise with the first rejection reason", "An array of settled promises"]', 2, NULL, 'Promise.all rejects immediately when any of the input promises rejects, with the reason from the first rejected promise.', 2),
('js-q-003', 'javascript', '11111111-0002-0001-0001-000000000001', 'open', 'Explain the difference between microtasks and macrotasks.', NULL, NULL, 'Microtasks (Promise callbacks, queueMicrotask) run after the current script and before the next macrotask. Macrotasks (setTimeout, setInterval) run one at a time, with microtasks executing between each.', 'This explains why Promise.then() callbacks run before setTimeout(..., 0) callbacks.', 3),
('js-q-004', 'javascript', '11111111-0002-0001-0001-000000000002', 'mcq', 'What is a closure in JavaScript?', '["A way to close browser windows", "A function with access to its outer scope variables", "A method to end loops", "A type of error handling"]', 1, NULL, 'A closure is a function that remembers and can access variables from its outer (enclosing) scope even after the outer function has returned.', 2),
('js-q-005', 'javascript', '11111111-0002-0001-0001-000000000002', 'open', 'Give an example of a practical use case for closures.', NULL, NULL, 'Common use cases include: data privacy (creating private variables), function factories, memoization, and maintaining state in event handlers or callbacks.', 'Closures are fundamental to many JavaScript patterns including the module pattern.', 2),
('js-q-006', 'javascript', '11111111-0002-0001-0001-000000000003', 'mcq', 'What is the difference between let and var?', '["let is function-scoped, var is block-scoped", "let is block-scoped, var is function-scoped", "They are identical", "let cannot be reassigned"]', 1, NULL, 'let is block-scoped and not hoisted the same way as var, which is function-scoped.', 1),
('js-q-007', 'javascript', '11111111-0002-0001-0001-000000000003', 'mcq', 'What does the spread operator (...) do with arrays?', '["Removes elements", "Expands an array into individual elements", "Combines arrays only", "Creates a deep copy"]', 1, NULL, 'The spread operator expands an iterable into individual elements, useful for copying, merging, and passing arguments.', 1),
('js-q-008', 'javascript', '11111111-0002-0001-0001-000000000003', 'mcq', 'What is destructuring in JavaScript?', '["Breaking code into modules", "Extracting values from arrays or objects into variables", "Removing properties from objects", "A debugging technique"]', 1, NULL, 'Destructuring allows you to unpack values from arrays or properties from objects into distinct variables.', 1),
('js-q-009', 'javascript', '11111111-0002-0001-0001-000000000001', 'mcq', 'What keyword makes a function return a Promise automatically?', '["promise", "await", "async", "defer"]', 2, NULL, 'The async keyword before a function declaration makes it always return a Promise.', 1),
('js-q-010', 'javascript', '11111111-0002-0001-0001-000000000002', 'open', 'What is the temporal dead zone?', NULL, NULL, 'The temporal dead zone (TDZ) is the period between entering a scope and the variable declaration being processed. Accessing let/const variables in this zone throws a ReferenceError.', 'This is why let and const behave differently than var regarding hoisting.', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed CSS Questions (10)
INSERT INTO public.questions (id, topic_id, category_id, type, prompt, choices, correct_choice_index, answer, explanation, difficulty) VALUES
('css-q-001', 'css', '11111111-0003-0001-0001-000000000001', 'mcq', 'What is the default flex-direction value?', '["column", "row", "row-reverse", "column-reverse"]', 1, NULL, 'The default flex-direction is row, which arranges items horizontally from left to right.', 1),
('css-q-002', 'css', '11111111-0003-0001-0001-000000000001', 'mcq', 'What does justify-content control in flexbox?', '["Alignment along the cross axis", "Alignment along the main axis", "The order of items", "The size of items"]', 1, NULL, 'justify-content aligns flex items along the main axis (horizontal for row, vertical for column).', 1),
('css-q-003', 'css', '11111111-0003-0001-0001-000000000001', 'open', 'Explain the difference between align-items and align-content.', NULL, NULL, 'align-items aligns items within a single line along the cross axis, while align-content distributes space between multiple lines when flex-wrap is enabled.', 'align-content only has an effect when there are multiple lines of flex items.', 2),
('css-q-004', 'css', '11111111-0003-0001-0001-000000000002', 'mcq', 'What does "fr" unit represent in CSS Grid?', '["Fixed ratio", "Fractional unit of available space", "Frame rate", "Flex ratio"]', 1, NULL, 'The fr unit represents a fraction of the available space in the grid container.', 2),
('css-q-005', 'css', '11111111-0003-0001-0001-000000000002', 'mcq', 'How do you create a 3-column grid with equal widths?', '["grid-template-columns: 3", "grid-template-columns: repeat(3, 1fr)", "grid-columns: 3", "columns: 3"]', 1, NULL, 'repeat(3, 1fr) creates three columns, each taking one fraction of the available space.', 1),
('css-q-006', 'css', '11111111-0003-0001-0001-000000000002', 'open', 'When would you choose Grid over Flexbox?', NULL, NULL, 'Use Grid for two-dimensional layouts (rows AND columns) and complex page layouts. Use Flexbox for one-dimensional layouts (row OR column) and component-level layouts.', 'Grid is ideal for overall page structure, while Flexbox excels at aligning items within a container.', 2),
('css-q-007', 'css', '11111111-0003-0001-0001-000000000003', 'mcq', 'What is the specificity order from lowest to highest?', '["ID, Class, Element", "Element, Class, ID", "Class, Element, ID", "ID, Element, Class"]', 1, NULL, 'Specificity from lowest to highest: element selectors (1), class selectors (10), ID selectors (100).', 2),
('css-q-008', 'css', '11111111-0003-0001-0001-000000000003', 'mcq', 'What does the "+" combinator select?', '["All siblings", "Direct children", "Immediately following sibling", "All descendants"]', 2, NULL, 'The adjacent sibling combinator (+) selects the element that immediately follows the first element.', 2),
('css-q-009', 'css', '11111111-0003-0001-0001-000000000003', 'mcq', 'What is the difference between :nth-child and :nth-of-type?', '[":nth-child counts all siblings, :nth-of-type counts only same type", "They are identical", ":nth-of-type is faster", ":nth-child is deprecated"]', 0, NULL, ':nth-child counts all siblings regardless of type, while :nth-of-type only counts siblings of the same element type.', 2),
('css-q-010', 'css', '11111111-0003-0001-0001-000000000001', 'mcq', 'What does flex-shrink: 0 do?', '["Makes the item grow", "Prevents the item from shrinking", "Removes the item", "Sets default shrinking"]', 1, NULL, 'flex-shrink: 0 prevents a flex item from shrinking when there is not enough space.', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed HTML Questions (10)
INSERT INTO public.questions (id, topic_id, category_id, type, prompt, choices, correct_choice_index, answer, explanation, difficulty) VALUES
('html-q-001', 'html', '11111111-0004-0001-0001-000000000001', 'mcq', 'Which element should be used for the main content of a page?', '["<div>", "<main>", "<section>", "<article>"]', 1, NULL, 'The <main> element represents the dominant content of the body, and there should only be one per page.', 1),
('html-q-002', 'html', '11111111-0004-0001-0001-000000000001', 'mcq', 'What is the difference between <section> and <article>?', '["They are identical", "<article> is for self-contained content, <section> for thematic grouping", "<section> is deprecated", "<article> is for blogs only"]', 1, NULL, '<article> represents self-contained content that could be distributed independently, while <section> is a thematic grouping of content.', 2),
('html-q-003', 'html', '11111111-0004-0001-0001-000000000001', 'open', 'Explain the purpose of semantic HTML and its benefits.', NULL, NULL, 'Semantic HTML uses elements that describe their meaning (header, nav, main, article, footer). Benefits: better accessibility, SEO, maintainability, and clearer code structure.', 'Screen readers and search engines understand semantic elements better than generic divs.', 2),
('html-q-004', 'html', '11111111-0004-0001-0001-000000000002', 'mcq', 'Which input type provides a date picker?', '["date", "datetime", "calendar", "picker"]', 0, NULL, 'The input type="date" provides a native date picker in supported browsers.', 1),
('html-q-005', 'html', '11111111-0004-0001-0001-000000000002', 'mcq', 'What attribute makes a form field required?', '["validate", "mandatory", "required", "must-fill"]', 2, NULL, 'The required attribute specifies that an input field must be filled out before submitting the form.', 1),
('html-q-006', 'html', '11111111-0004-0001-0001-000000000002', 'open', 'What is the purpose of the <label> element and how should it be used?', NULL, NULL, 'Labels provide accessible names for form controls. Use the for attribute matching the input''s id, or wrap the input inside the label. This improves accessibility and provides a larger click target.', 'Always associate labels with their form controls for accessibility.', 1),
('html-q-007', 'html', '11111111-0004-0001-0001-000000000003', 'mcq', 'What attribute provides alternative text for images?', '["title", "alt", "description", "caption"]', 1, NULL, 'The alt attribute provides alternative text that describes the image for screen readers and when images cannot load.', 1),
('html-q-008', 'html', '11111111-0004-0001-0001-000000000003', 'mcq', 'What is the purpose of ARIA attributes?', '["Styling elements", "Making content accessible to assistive technologies", "SEO optimization", "Form validation"]', 1, NULL, 'ARIA (Accessible Rich Internet Applications) attributes help make dynamic content and UI components accessible to people using assistive technologies.', 2),
('html-q-009', 'html', '11111111-0004-0001-0001-000000000003', 'open', 'When should you use ARIA roles vs semantic HTML?', NULL, NULL, 'Prefer semantic HTML elements when available as they have built-in accessibility. Use ARIA only when semantic elements don''t exist for your use case or when building custom interactive components.', 'The first rule of ARIA is: don''t use ARIA if a native HTML element will work.', 2),
('html-q-010', 'html', '11111111-0004-0001-0001-000000000001', 'mcq', 'Which element should contain navigation links?', '["<div>", "<menu>", "<nav>", "<links>"]', 2, NULL, 'The <nav> element is specifically designed to contain navigation links.', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Flashcards (5 per topic = 20 total)
-- React Flashcards
INSERT INTO public.flashcards (id, topic_id, category_id, front, back) VALUES
('react-fc-001', 'react', '11111111-0001-0001-0001-000000000001', 'What is the useState hook?', 'useState is a Hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.'),
('react-fc-002', 'react', '11111111-0001-0001-0001-000000000001', 'What is the useEffect cleanup function?', 'The function returned from useEffect runs before the component unmounts and before every re-run of the effect. Use it to clean up subscriptions, timers, or event listeners.'),
('react-fc-003', 'react', '11111111-0001-0001-0001-000000000002', 'What is the Virtual DOM?', 'A lightweight copy of the actual DOM that React uses to determine what changes need to be made. React compares the virtual DOM with the previous version and only updates what changed.'),
('react-fc-004', 'react', '11111111-0001-0001-0001-000000000003', 'What is prop drilling?', 'Passing data through multiple levels of components that don''t need the data themselves, just to get it to a deeply nested child. Context API or state management libraries can solve this.'),
('react-fc-005', 'react', '11111111-0001-0001-0001-000000000001', 'What does useCallback do?', 'useCallback memoizes a callback function, returning the same function reference between renders unless dependencies change. Useful for optimizing child components that rely on reference equality.')
ON CONFLICT (id) DO NOTHING;

-- JavaScript Flashcards
INSERT INTO public.flashcards (id, topic_id, category_id, front, back) VALUES
('js-fc-001', 'javascript', '11111111-0002-0001-0001-000000000001', 'What is a Promise?', 'A Promise is an object representing the eventual completion or failure of an asynchronous operation. It can be pending, fulfilled, or rejected.'),
('js-fc-002', 'javascript', '11111111-0002-0001-0001-000000000002', 'What is hoisting?', 'JavaScript''s behavior of moving declarations to the top of their scope during compilation. var declarations are hoisted and initialized as undefined; let/const are hoisted but not initialized (TDZ).'),
('js-fc-003', 'javascript', '11111111-0002-0001-0001-000000000003', 'What are arrow functions?', 'Concise function syntax (=>) that don''t have their own this, arguments, super, or new.target. They inherit this from the enclosing scope (lexical this).'),
('js-fc-004', 'javascript', '11111111-0002-0001-0001-000000000003', 'What is the nullish coalescing operator (??)?', 'Returns the right-hand operand when the left-hand operand is null or undefined. Unlike ||, it doesn''t trigger for falsy values like 0 or empty string.'),
('js-fc-005', 'javascript', '11111111-0002-0001-0001-000000000001', 'What is async/await?', 'Syntactic sugar over Promises. async functions always return a Promise. await pauses execution until the Promise resolves, making async code look synchronous.')
ON CONFLICT (id) DO NOTHING;

-- CSS Flashcards
INSERT INTO public.flashcards (id, topic_id, category_id, front, back) VALUES
('css-fc-001', 'css', '11111111-0003-0001-0001-000000000001', 'What is the flex shorthand?', 'flex: <grow> <shrink> <basis>. Default is 0 1 auto. flex: 1 is shorthand for flex: 1 1 0, making items grow equally.'),
('css-fc-002', 'css', '11111111-0003-0001-0001-000000000002', 'What is grid-template-areas?', 'Defines named grid areas that can be referenced by grid items. Allows you to create layouts using ASCII-art like syntax.'),
('css-fc-003', 'css', '11111111-0003-0001-0001-000000000003', 'What is CSS specificity?', 'The algorithm that determines which CSS rule applies. Calculated as: inline styles (1000), IDs (100), classes/attributes/pseudo-classes (10), elements/pseudo-elements (1).'),
('css-fc-004', 'css', '11111111-0003-0001-0001-000000000001', 'What does align-self do?', 'Overrides the align-items value for a specific flex item, allowing it to have different cross-axis alignment than other items.'),
('css-fc-005', 'css', '11111111-0003-0001-0001-000000000002', 'What is minmax() in Grid?', 'A function that defines a size range for grid tracks. minmax(200px, 1fr) means at least 200px but can grow to fill available space.')
ON CONFLICT (id) DO NOTHING;

-- HTML Flashcards
INSERT INTO public.flashcards (id, topic_id, category_id, front, back) VALUES
('html-fc-001', 'html', '11111111-0004-0001-0001-000000000001', 'What is the <figure> element for?', 'Represents self-contained content like images, diagrams, or code snippets with an optional <figcaption>. Used when the content is referenced from the main content.'),
('html-fc-002', 'html', '11111111-0004-0001-0001-000000000002', 'What is the pattern attribute?', 'Specifies a regular expression that the input value must match for form validation. Works with text, email, url, tel, search, and password inputs.'),
('html-fc-003', 'html', '11111111-0004-0001-0001-000000000003', 'What is tabindex?', 'Controls keyboard navigation order. tabindex="0" adds element to natural tab order, negative values remove it, positive values set explicit order (avoid).'),
('html-fc-004', 'html', '11111111-0004-0001-0001-000000000001', 'What is the <aside> element?', 'Represents content tangentially related to the content around it, like sidebars, pull quotes, or advertising. Could be removed without affecting the main content.'),
('html-fc-005', 'html', '11111111-0004-0001-0001-000000000003', 'What is aria-label?', 'Provides an accessible name for elements that don''t have visible text. Screen readers will read this instead of the element''s content.')
ON CONFLICT (id) DO NOTHING;