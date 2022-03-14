# Your Basic Web Framework

> Disclaimer : This tool is _not_ designed to be efficient, its primary purpose is lightness and learning

**If you are a beginner, wait a bit, I'm working on an article so you can learn web development easily with this tool**

## **What** is this ?

This web framework is a way to create server-side rendered with javascript, with minimal knowledge required.

## **Why** does this exists ?

I remember learning PHP a while back, and while it was pretty fun to create websites with it, I quickly learned to love Javascript and its syntax.

Today I find PHP a bit hard to write without a proper framework, but I miss the old way of creating websites, based on the true basics of the web (mainly forms and static pages).

This small framework is a way to teach people how to create websites, with a rather small learning curve, so they can concentrate on the true basics.

I also want to create a course, to explain how to use this, but also how it does work behind the scenes.

## Getting started

### Install the framework

With npm :

```bash
npm i --save your-web-framework
```

With yarn :

```bash
yarn add your-web-framework
```

### Add a `server.js` file

```js
import("your-web-framework").then((web) => web.default());
```

Now add pages and run `node server.js`

### Example page

```html
<script server>
	let form = { name: undefined };
	if (req.method == 'POST') {
	  form = req.body;
	}

	let paragraphs = req.query.paragraphs ?? 10;

	return {
	  title: "Demo",
	  lorem: await fetch(`https://loripsum.net/api/${paragraphs}`).then(r => r.text()),
	  form,
	}
</script>

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${title}</title>
	</head>
	<body>
		<main>
			<h1>Welcome to ${title}</h1>
			<ul>
				${[1, 2, 3, 4].map((i) => `
				<li>item ${i}</li>
				`).join('')}
			</ul>

			<h2>Here is a form :</h2>
			<form method="post">
				${form?.name != null ? `<span>Hello ${form.name} !</span>` : ''}
				<input type="text" name="name" placeholder="Your name" />
				<button type="submit">Submit</button>
			</form>

			<hr />

			<h2>Here is some (server-side fetched) lorem ipsum :</h2>
			<p>
				You can add a ?paragraphs=5 parameter in the url to change the number of
				rendered paragraphs
			</p>

			<section>${lorem}</section>
		</main>
	</body>
</html>
```

## **How** does it works ?

## Server side rendering

It works in a pretty simple fashion, an [Express](https://expressjs.com/) server serves the routes you give it.  
When the server starts, the framework read all your html files and parse them. It computes functions that can render a webpage.  
When you access a route in your browser, this function is executed and your page is created and then served back to you.

## Server code

You can compute data to display inside your page with a special `<script/>` tag that will be removed from the final page (of course). This special server tag can be anywhere and must have a `server` attribute.

```html
<script server>
	// Your Javascript server code here
</script>
```

Inside this script tag, you have access to the client request with the `req` variable (it's the same `req` as [the Express one](https://expressjs.com/en/4x/api.html#req)), you have also access to [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) and the [async/await syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

```html
<script server>
	// Here you can use everything in the `req` object from Express
	let form = { name: undefined };
	if (req.method == 'POST') {
	  form = req.body;
	}

	// You can use everything ES2022 gives you
	let paragraphs = req.query.paragraphs ?? 10;
	let lorem = await fetch(`https://loripsum.net/api/${paragraphs}`).then(r => r.text()),
</script>
```

If you want to make some variables available in your template, you'll need to return a dictionary of them, as an object. I call this dictionary the _bag_.

```html
<script server>
	return {
		page: 1,
		title: "hello",
	};
</script>
```

You can also store state for the duration of the server, in the `state` variable.  
States are local to the route.

```html
<script server>
	if (req.method == "POST") {
		state.counter++;
	}
</script>
```

If you need to share data between routes, you can use the `global` variable (but only in server code, not in templating)

You can import any module you need by using the `await import("module")` syntax.

```html
<script server>
	let fs = await import("fs/promises");

	return {
		files: await fs.readdir('.'),
	}
</script>
```

## Templating

Of course, to build a web page, you need a templating system to display your data.  
I always found the templating system in PHP pretty hard to write and to read.

Coming from a React ecosystem, I used a functional templating system to save me some headaches. You can use ${templateLiterals} to insert an expression that will be displayed.

```html
<h1>Welcome to ${title}</h1>
```

If you want to conditionally display something, you'll need to compute it beforehand in a variable or use a ternary (JSX-style !)

```html
<div>${user ? user.name : "Anonymous"}</div>
```

If you want to iterate over something and display the items, you'll need to compute it beforehand in a variable or use a map (JSX-style !)

```html
<ul>
	${items.map(i => `
	<li>${i}</li>
	`)}
</ul>
```

I know it can be a little be hard to learn for newcomers but I think this is the only high step, and I think i can be very beneficial to learn this approach early before exploring the world of web development.

Virtually every javascript expression can be used inside the templating system.

You can access the route `state` variable in your template, but remember to use state only when you want data to **persist** between renders, it's a waste of memory to use the `state` variable only to pass data to the template, use the bag instead.

## Routing

To serve different pages, create your html pages with your server code somewhere. (let's say at the root of your project)

Now, to run your server, create a `./server.js` and import and run the framework :

```js
import("your-web-framework").then((web) => web.default());
```

An Express server will start, you can configure it with an object parameter. (you can look at [the code](./src/index.ts) to see the parameters)

### Nested routes

You can put routes inside of folders to create nested routes. `index.html` will always be the base of a route.

Let's say you have these files :

```
nested/
	a.html
	b.html
	c.html
	index.html
form.html
index.html
```

You will then have these routes :

```
/		-> ./index.html
/form		-> ./form.html
/nested		-> ./nested/index.html
/nested/a	-> ./nested/a.html
/nested/b	-> ./nested/b.html
/nested/c	-> ./nested/c.html
```

### Route params

Since we're using Express for our server, we can use route params really easily.  
You can create a file or a directory with a colon to declare a parameter :

```
./params/:param.html 	-> /params/abcd, /params/yes, /params/123 etc.
./users/:id/edit.html -> /users/7452/edit, /users/1337/edit etc.
```

And since we have access to the `req` object from Express, we can access the route parameters in our script like this :

```html
<!-- ./users/:id/edit.html -->
<script server>
	return {
		userId: req.params.id,
	};
</script>

<h1>Edition of user ${userId}</h1>
```

## Components

Of course, you'll want to avoid repeating similar code. Think about the doctype and the head of your pages, they'll probably always be the same, minus some differences here and there.

You can use components to "import" chunks of code and pass them properties (`props`) so they can save you some time.

To import a component in your template, you'll need to declare it in your server code with then provided `getComponent()` function and pass it to the template via the bag.  
You can then render your component by `await`ing it (since it can contain asynchronous code too)

```html
<script server>
	// Here we create a function that can render our component
	// getComponent() only take the name of you component
	let myComp = getComponent("my-component");

	return {
		myComp,
	};
</script>

<main>${ await myComp() }</main>
```

### Component names

In this example the name `my-component` comes from a file name `$my-component.html` at the root of the server.  
The `$` symbol tells the framework not to serve this page, but to register it as an available component.

You can store your components wherever you want and refer to them by their route :

```
'./$compA' 						-> getComponent('compA');
'./directory/$compB' 	-> getComponent('directory/compB'),
```

### Component props

You can provide dynamic values to your components when you display them in your template.  
A component function takes an object as its first argument, its props.

```html
<!-- ./index.html -->
<script server>
	return {
		myComp: await getComponent('my-comp')
	}
</script>

${ await myComp({ title: "Home", subtitle: "Welcome !" })}
```

Now, your component can access its props via the `props` variable (available in your server script and your expressions) :

```html
<!-- ./$my-comp.html -->
<main>
	<h1>${ props.title }</h1>
	<h2>${ props.subtitle }</h2>
</main>
```

This will then render :

```html
<main>
	<h1>Hello</h1>
	<h2>Welcome !</h2>
</main>
```

### Component outlet and children

Back to our previous problem, avoiding the duplication of the doctype and the head, we could create a component like this :

```html
<!-- ./index.html -->
<script server>
	return {
		layout: await getComponent('layout')
	}
</script>

${ await layout({ title: "My awesome website" })}
```

```html
<!-- ./$layout.html -->
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="stylesheet" href="/bulma.min.css" />
		<title>${props.title}</title>
	</head>
	<body></body>
</html>
```

And that would be great because our `<title/>` tag would get the right value, depending on the page.  
But what about the _content_ of the page ? How can we put our content _inside_ the `<body/>` ?

That's where the `<outlet/>` and the `children` comes into play.  
Our component can declare an `<outlet/>` tag somewhere that will be replaced by some other content.

This other content are named the `children` of the component and are passed as the second argument when displaying a component.  
This argument can be a template string without any problem.

```html
<!-- ./index.html -->
<script server>
	return {
		layout: await getComponent('layout'),
	}
</script>

${ await layout({ title: "My awesome website" }, `
<h1>Welcome !</h1>

<nav>
	<a href="/page2">Page 2</a>
</nav>
`)}
```

```html
<!-- ./$layout.html -->
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${props.title}</title>
	</head>
	<body>
		<outlet />
	</body>
</html>
```

This will then display :

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>My awesome website</title>
	</head>
	<body>
		<h1>Welcome !</h1>

		<nav>
			<a href="/page2">Page 2</a>
		</nav>
	</body>
</html>
```

## To-do

- [x] Templating system
- [x] Server side rendering
- [x] Public file serving
- [x] A well commented code for curious people
- [x] Add watch mode to the server
- [x] Add a in-memory state for the routes
- [x] Use ${} for templates instead of {{}}
- [x] Create a package on npm (`your-web-framework`)
- [x] Add nested routes
- [x] Import "components" with server code
- [ ] Add named outlets
- [ ] An article to explain this to beginners

Suggestions and pull requests are welcome of course !
