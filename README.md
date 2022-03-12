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

## Example page

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
		<link rel="stylesheet" href="tailwind.min.css" />
		<title>{{title}}</title>
	</head>
	<body>
		<main>
			<h1>Welcome to {{title}}</h1>
			<ul>
				{{[1, 2, 3, 4].map((i) => `
				<li>item ${i}</li>
				` )}}
			</ul>

			<h2>Here is a form :</h2>
			<form method="post">
				{{form?.name != null ? `<span>Hello ${form.name} !</span>` : ''}}
				<input type="text" name="name" placeholder="Your name" />
				<button type="submit">Submit</button>
			</form>

			<hr />

			<h2>Here is some (server-side fetched) lorem ipsum :</h2>
			<p>
				You can add a ?paragraphs=5 parameter in the url to change the number of
				rendered paragraphs
			</p>

			<section>{{lorem}}</section>
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

If you want to make some variables available in your template, you'll need to return a dictionary of them, as an object.

```html
<script server>
	return {
		page: 1,
		title: "hello",
	};
</script>
```

## Templating

Of course, to build a web page, you need a templating system to display your data.  
I always found the templating system in PHP pretty hard to write and to read.

Coming from a React ecosystem, I used a functional templating system to save me some headaches. You can use {{mustaches}} to insert **an expression** that will be displayed (I'd love to change this to a javascript-like interpolation later though).

I insist, it's an **expression**, meaning you **have** to return something if you want to display it.

```html
<h1>Welcome to {{ title }}</h1>
```

If you want to conditionally display something, you'll need to compute it beforehand in a variable or use a ternary (JSX-style !)

```html
<div>{{ user ? user.name : "Anonymous" }}</div>
```

If you want to iterate over something and display the items, you'll need to compute it beforehand in a variable or use a map (JSX-style !)

```html
<ul>
	{{ items.map(i => `
	<li>${i}</li>
	`) }}
</ul>
```

I know it can be a little be hard to learn for newcomers but I think this is the only high step, and I think i can be very beneficial to learn this approach early before exploring the world of web development.

Virtually every javascript expression can be used inside the templating system.

## Routing

To serve different pages, create your html pages with your server code somewhere. (let's say at the root of your project)

Now, to run your server, create a `./server.js` and import and run the framework :

```js
import runWebServer from "web-framework";

runWebServer();
```

An Express server will start, you can configure it with an object parameter. (you can look at [the code](./src/index.ts) to see the parameters)

## To-do

- [x] Templating system
- [x] Server side rendering
- [x] Public file serving
- [ ] Use ${} for templates instead of {{}}
- [x] A well commented code for curious people
- [ ] An article to explain this to beginners
- [ ] Import "components" with server code
- [ ] Support layout routes to avoid writing the entire html each time

Suggestions and pull requests are welcome of course !