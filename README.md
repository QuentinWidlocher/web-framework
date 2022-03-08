# Your Basic Web Framework

> Disclaimer : This tool is _not_ designed to be efficient, its primary purpose is lightness and learning

**If you are a web beginner, wait a bit, I'm working on an article so you can learn web development easily with this tool**

## **What** is this ?

This web framework is a way to create server-side rendered with javascript, with minimal knowledge required.

## **Why** is this ?

I remember learning PHP a while back, and while it was pretty fun to create websites with it, I quickly learned to love Javascript and its syntax.

Today I find PHP a bit hard to write without a proper framework, but I miss the old way of creating websites, based on the true basics of the web.

This small framework is a way to teach people how to create websites, with a rather small learning curve, so they can concentrate on the true basics.

## **How** is this ?

## Server side rendering

It works in a pretty simple fashion, an express server host routes you give to it.  
At launch, the framework read your html files and parse them, computing a server-side function.  
When you access a route, this function is executed and you page is created then served back to you.

## Server code

You can easily compute data to display inside your page in a special script tag that will be removed from the final page (of course). This special server tag can be anywhere and must have a `server` attribute.

Inside this script tag, you have access to the client request with the `req` variable (the same `req` as the Express one), you have access to `fetch` and async/await.

If you want to make some variables accessible in the template, you need to return a dictionary of them, as an object.

### Example of server code

```html
<!-- This is before the doctype because we don't care, it'll be removed from the response -->
<!-- See how we put the `server` attribute here -->
<script server>
	// Here you can use everything you can with the `req` object from Express
	let form = { name: undefined };
	if (req.method == 'POST') {
	  form = req.body;
	}

	// You can use everything ES2022 gives you
	let paragraphs = req.query.paragraphs ?? 10;
	let lorem: await fetch(`https://loripsum.net/api/${paragraphs}`).then(r => r.text()),

	// None of the variables will be available in the template by default
	// Here, we say that only these variables are available but `req` will always be available
	return {
	  title: "Demo",
	  lorem
	  form,
	}
</script>

<!-- Only this will be rendered to the page -->
<!DOCTYPE html>
<html lang="en">
	<!-- ... -->
</html>
```

## Templating

Of course, to build a web page, you need a templating system to display your data.  
I always found the templating system in PHP pretty hard to grasp and to read.

Coming from a React ecosystem, I used a functional templating system to save me some headaches. You can use a mustache (I'd love to change this to a javascript-like interpolation later) to insert **an expression** that will be displayed.

I insist, it's an **expression**, meaning you **have** to return something if you want to display it.

If you want to conditionally display something, you'll need to compute it beforehand in a variable or to use a ternary (JSX-style)  
If you want to iterate over something and display the items, you'll need to use a map (JSX-style)

I know it can be a little be hard to learn for newcomers but I think this is the only high step, and it's very beneficial to learn this approach early before exploring the world of web development.

Virtually every javascript expression can be used inside the templating system. (if you REALLY want a imperative approach you COULD use an IIFE but I'd advise against it)

### Example of the templating system

```html
<!-- Simple interpolation -->
<h1>Welcome to {{title}}</h1>

<!-- Conditional rendering -->
<span>{{done ? 'Done' : 'To do'}}</span>

<!-- Iteration -->
<ul>
	{{list.map(i => `
	<li>${i}</li>
	`)}}
</ul>

<!-- Ugly and useless IIFE -->
<!-- DON'T TRY THIS AT HOME -->
<span>{{(() => { return "yes" })()}}</span>
```

## Routing

To serve different pages, put them somewhere, let's say in `./templates/` and add your `.html` files inside with your server code.

Now, to run your server, create a `./server.js` for example and import and run the framework :

```js
import runWebServer from "web-framework";

runWebServer();
```

An Express server will start, you can configure it with an object parameter. (you can look at [the code](./src/index.ts) to see the parameters)

## To-do

- [x] Templating system
- [x] Server side rendering
- [ ] Public file serving
- [ ] Use ${} for templates instead of {{}}
- [ ] A well commented code for curious people
- [ ] An article to explain this to beginners

Suggestions and pull requests are welcome of course !
