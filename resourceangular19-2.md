## Me

why getting GET http://localhost:4200/src/app/pages/home/sticky-search.component.ts?t=1743984476919 500 (Internal Server Error) in chrome console for #buffer

## CodeCompanion (Anthropic)

This error typically occurs in Angular development when the development server can't locate or serve a TypeScript file. Here are the likely causes and solutions:

1. Incorrect File Path

- Check if `sticky-search.component.ts` exists in the specified location
- Verify the file path matches your project structure

2.

## Me

## CodeCompanion (Anthropic)

This error typically occurs in Angular development when the development server can't locate or serve a TypeScript file. Here are the likely causes and solutions:

1. File Path Issues:

- Check if `sticky-search.component.ts` exists in the correct location
- Verify the path: `src/app/pages/home/sticky-search.component.ts`

2. Common Solutions:

```bash
# Stop the Angular server and clear cache
ng cache clean

# Restart the Angular server
ng serve
```

3. If that doesn't work:

- Clear browser cache
- Check file permissions
- Ensure no syntax errors in the component file
- Verify the component is properly declared in its module

The 500 error suggests a server-side issue rather than a client-side routing problem. The timestamp in the URL (`t=1743984476919`) indicates this is a development server request.

Would you like me to help you verify the component's file structure or check the module declarations?

## Me

why

3:37:59 AM [vite] Internal server error: Object is possibly 'undefined'.
Plugin: @analogjs/vite-plugin-angular
File: /home/dbk/work-public/deenji-code/deenji/src/app/pages/home/sticky-search.component.ts
at TransformPluginContext.\_formatError (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47574:41)
at TransformPluginContext.error (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47569:16)
at TransformPluginContext.transform (file:///home/dbk/work-public/deenji-code/node_modules/@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin.js:423:30)
at async EnvironmentPluginContainer.transform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47400:18)
at async loadAndTransform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:41198:27)
at async viteTransformMiddleware (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:42642:24)
3:38:31 AM [vite] Internal server error: Object is possibly 'undefined'.
Plugin: @analogjs/vite-plugin-angular
File: /home/dbk/work-public/deenji-code/deenji/src/app/pages/home/sticky-search.component.ts
at TransformPluginContext.\_formatError (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47574:41)
at TransformPluginContext.error (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47569:16)
at TransformPluginContext.transform (file:///home/dbk/work-public/deenji-code/node_modules/@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin.js:423:30)
at async EnvironmentPluginContainer.transform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47400:18)
at async loadAndTransform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:41198:27)
at async viteTransformMiddleware (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:42642:24) (x2)
3:44:45 AM [vite] Internal server error: Object is possibly 'undefined'.
Plugin: @analogjs/vite-plugin-angular
File: /home/dbk/work-public/deenji-code/deenji/src/app/pages/home/sticky-search.component.ts
at TransformPluginContext.\_formatError (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47574:41)
at TransformPluginContext.error (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47569:16)
at TransformPluginContext.transform (file:///home/dbk/work-public/deenji-code/node_modules/@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin.js:423:30)
at async EnvironmentPluginContainer.transform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:47400:18)
at async loadAndTransform (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:41198:27)
at async viteTransformMiddleware (file:///home/dbk/work-public/deenji-code/node_modules/vite/dist/node/chunks/dep-M1IYMR16.js:42642:24) (x3)

## CodeCompanion (Anthropic)

This error is coming from Vite and the AnalogJS plugin, specifically indicating there's a TypeScript error in your `sticky-search.component.ts` file. The error "Object is possibly 'undefined'" means you're trying to access a property or method of an object that TypeScript thinks might be undefined.

Common fixes:

1. Add null checks using optional chaining:

```typescript
// Instead of
someObject.property;

// Use
someObject?.property;
```

2. Add type guards:

```typescript
if (someObject) {
  someObject.property;
}
```

3. Use non-null assertion (only if you're sure the object exists):

```typescript
someObject!.property;
```

Could you share the content of your `sticky-search.component.ts` file so I can identify the exact location of the undefined object?

## Me

> Sharing:
>
> - <buf>deenji/src/app/pages/home/sticky-search.component.ts</buf>

yes see #buffer

## CodeCompanion (Anthropic)

The error "Object is possibly 'undefined'" is occurring because of line 16:

```typescript
import { httpResource } from '@angular/common/http';
```

This is incorrect - `httpResource` is not a part of `@angular/common/http`. It seems you're trying to use a feature that might be from AnalogJS or another library.

To fix this:

1. If you're using AnalogJS, correct the import:

```typescript
import { httpResource } from '@analogjs/platform';
```

2. If you don't have access to `httpResource`, you can replace the search functionality with a traditional HTTP service:

```typescript
// Create a search service
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private http: HttpClient) {}

  search(term: string) {
    return this.http.get<{ hits: ElasticsearchHit[] }>(`/api/search?q=${encodeURIComponent(term)}`);
  }
}

// Then in your component, replace searchResource with:
private searchResults = signal<{ hits: ElasticsearchHit[] }>({ hits: [] });

// Update the search method
updateSearchQuery(query: string): void {
  this.searchQuery.set(query || '');
  if (query && query.length >= 2) {
    this.searchService.searchSuggestions.isLoading.set(true);
    this.searchService.search(query).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searchService.searchSuggestions.isLoading.set(false);
      },
      error: () => {
        this.searchService.searchSuggestions.isLoading.set(false);
      }
    });
  }
}
```

Would you like me to help you implement either of these solutions or explore other alternatives?

## Me

> Sharing:
>
> - <buf>deenji/src/app/pages/home/sticky-search.component.ts</buf>

that's angular 19.2 check the following articles:

# 1

Dependent state with linkedSignal
edit
IMPORTANT: linkedSignal is developer preview. It's ready for you to try, but it might change before it is stable.

You can use the signal function to hold some state in your Angular code. Sometimes, this state depends on some other state. For example, imagine a component that lets the user select a shipping method for an order:

@Component({/_ ... _/})
export class ShippingMethodPicker {
shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();
// Select the first shipping option by default.
selectedOption = signal(this.shippingOptions()[0]);
changeShipping(newOptionIndex: number) {
this.selectedOption.set(this.shippingOptions()[newOptionIndex]);
}
}
check
In this example, the selectedOption defaults to the first option, but changes if the user selects another option. But shippingOptions is a signal— its value may change! If shippingOptions changes, selectedOption may contain a value that is no longer a valid option.

The linkedSignal function lets you create a signal to hold some state that is intrinsically linked to some other state. Revisiting the example above, linkedSignal can replace signal:

@Component({/_ ... _/})
export class ShippingMethodPicker {
shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();
// Initialize selectedOption to the first shipping option.
selectedOption = linkedSignal(() => this.shippingOptions()[0]);
changeShipping(index: number) {
this.selectedOption.set(this.shippingOptions()[index]);
}
}
check
linkedSignal works similarly to signal with one key difference— instead of passing a default value, you pass a computation function, just like computed. When the value of the computation changes, the value of the linkedSignal changes to the computation result. This helps ensure that the linkedSignal always has a valid value.

The following example shows how the value of a linkedSignal can change based on its linked state:

const shippingOptions = signal(['Ground', 'Air', 'Sea']);
const selectedOption = linkedSignal(() => shippingOptions()[0]);
console.log(selectedOption()); // 'Ground'
selectedOption.set(shippingOptions()[2]);
console.log(selectedOption()); // 'Sea'
shippingOptions.set(['Email', 'Will Call', 'Postal service']);
console.log(selectedOption()); // 'Email'
check
On this page
Accounting for previous state
Custom equality comparison

arrow_upward_alt
Back to the top
Accounting for previous state
In some cases, the computation for a linkedSignal needs to account for the previous value of the linkedSignal.

In the example above, selectedOption always updates back to the first option when shippingOptions changes. You may, however, want to preserve the user's selection if their selected option is still somewhere in the list. To accomplish this, you can create a linkedSignal with a separate source and computation:

interface ShippingMethod {
id: number;
name: string;
}
@Component({/_ ... _/})
export class ShippingMethodPicker {
constructor() {
this.changeShipping(2);
this.changeShippingOptions();
console.log(this.selectedOption()); // {"id":2,"name":"Postal Service"}
}
shippingOptions = signal<ShippingMethod[]>([
{ id: 0, name: 'Ground' },
{ id: 1, name: 'Air' },
{ id: 2, name: 'Sea' },
]);
selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
// `selectedOption` is set to the `computation` result whenever this `source` changes.
source: this.shippingOptions,
computation: (newOptions, previous) => {
// If the newOptions contain the previously selected option, preserve that selection.
// Otherwise, default to the first option.
return (
newOptions.find((opt) => opt.id === previous?.value.id) ?? newOptions[0]
);
},
});
changeShipping(index: number) {
this.selectedOption.set(this.shippingOptions()[index]);
}
changeShippingOptions() {
this.shippingOptions.set([
{ id: 0, name: 'Email' },
{ id: 1, name: 'Sea' },
{ id: 2, name: 'Postal Service' },
]);
}
}
check
When you create a linkedSignal, you can pass an object with separate source and computation properties instead of providing just a computation.

The source can be any signal, such as a computed or component input. When the value of source changes, linkedSignal updates its value to the result of the provided computation.

The computation is a function that receives the new value of source and a previous object. The previous object has two properties— previous.source is the previous value of source, and previous.value is the previous result of the computation. You can use these previous values to decide the new result of the computation.

Custom equality comparison
linkedSignal, as any other signal, can be configured with a custom equality function. This function is used by downstream dependencies to determine if that value of the linkedSignal (result of a computation) changed:

const activeUser = signal({id: 123, name: 'Morgan', isAdmin: true});
const activeUserEditCopy = linkedSignal(() => activeUser(), {
// Consider the user as the same if it's the same `id`.
equal: (a, b) => a.id === b.id,
});
// Or, if separating `source` and `computation`
const activeUserEditCopy = linkedSignal({
source: activeUser,
computation: user => user,
equal: (a, b) => a.id === b.id,
});

---

# 2

Angular 19 is here, and its renaissance continues, further embracing the power of signals.
This release introduces two new primitives that simplify handling asynchronous requests: resource() and rxResource(). These APIs enable a cleaner and more intuitive way to manage asynchronous data in Angular applications.

While resource() and rxResource() provide powerful tools for handling API calls reactively, Angular 19.2 introduces yet another step forward: httpResource(), a new API that integrates seamlessly with HttpClient, eliminating even more boilerplate.
If you're interested in taking reactive API calls to the next level, don't miss our deep dive into httpResource() and how it compares with the existing solutions.

Check out the new article on httpResource() 👇🏻

Angular v19+ — Understanding the New httpResource() API 🔥🚀
Angular v19.2 has been live for a few days, and once again, the Angular team hasn’t missed the opportunity to introduce…
medium.com

Note: These APIs are still in experimental state!

Signals: A Quick Refresher
Signals represent a new paradigm for Angular application development. Paired with a Zoneless approach, they not only enhance application performance but also improve the Developer Experience (DX).

By using a signal in your view, you can precisely inform Angular which node in the component tree needs to be updated. This fine-grained reactivity results in faster updates and a more efficient rendering pipeline.

Here’s a quick example demonstrating how to create and manipulate a signal in Angular:

import { Component, signal } from "@angular/core";

@Component({
selector: "my-component",
template: `

<p>{{ counter() }}</p>

    <button (click)="add()">Add</button>
    <button (click)="remove()">Remove</button>
    <button (click)="reset()">Reset</button>

`,
})
export default class MyComponent {
counter = signal<number>(0);

add() {
this.counter.update((current) => current + 1);
}

remove() {
this.counter.update((current) => current - 1);
}

reset() {
this.counter.set(0);
}
}
Which Problem Are They Solving?
In the early days of Angular signals, several new patterns emerged. One of these patterns tackled how to combine signals with the HttpClient to manage API responses. A common implementation might look like this:

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

import { API_URL, User } from './user';

@Injectable({ providedIn: 'root' })
export class ApiService {
#http = inject(HttpClient);
#response = signal<User[] | null>(null);

get users() {
return this.#response.asReadonly();
}

doApiCall(request: string = '') {
this.#http
.get<{ users: User[] }>(`${API_URL}/search?q=${request}`)
.pipe(map(({ users }) => users))
.subscribe((response) => this.#response.set(response));
}
}
While functional, this approach feels clunky and verbose. It introduces unnecessary boilerplate and requires developers to manually manage loading and error states. Moreover, mixing signals with observables can lead to code that is harder to maintain and reason about, reducing clarity and increasing cognitive overhead.

resource(): Simplifying Asynchronous API Calls
The new resource primitive in Angular provides an elegant way to manage asynchronous API calls in a signal-based application. By leveraging resource, you can seamlessly integrate reactive API calls into your app with better state handling and cleaner code.

Here’s an example of how resource() can be used:

import { Component, signal, resource } from "@angular/core";

@Component({
selector: "my-component",
template: `
<input (input)="search($event)" placeholder="Search user..."/>

    <br />
    <ul>
      @let error = users.error();
      @if (error) {
        <p>{{ error }}</p>
      }

      @if (users.isLoading()) {
        <p>Loading Users...</p>
      }

      @for (user of users.value(); track user.id) {
        <li>{{ user.firstName }} {{ user.lastName }}</li>
      } @empty {
        <p>No Users!</p>
      }
    </ul>

`,
})
export default class MyComponent {
query = signal<string>("");

// The resource can be typed as follows:
// resource<response type, request type>
users = resource<User[], string>({
request: () => this.query(),
loader: async ({ request, abortSignal }) => {
const response = await fetch(`${API_URL}/search?q=${request}`, {
signal: abortSignal,
});

      if (!response.ok) throw new Error("Unable to load users!");
      return (await response.json()).users;
    },

});

search(event: Event) {
const { value } = event.target as HTMLInputElement;
this.query.set(value);
}
}
Diving Deeper into the resource() API
The resource() API introduces two essential components to handle asynchronous data:

request: A function that returns a value used for the loader computation. Every time query() changes, the loader function is re-triggered, behaving similarly to a computed signal.
loader: The function where the actual API call is performed. It must return a promise, and errors can be handled like any standard promise.
Built-In Properties of resource()
The resource primitive comes with several useful out-of-the-box properties, all of which are signals:

value(): Retrieves the current value of the resource's response.
isLoading(): Indicates whether the resource is currently loading.
error(): Contains the error, if any, encountered during the API call.
What About rxResource()?
While resource() uses a promise-based loader, rxResource() provides a similar abstraction but leverages Observable streams instead. This makes it a perfect fit for scenarios where your application is already heavily reliant on RxJS or where Observables are the preferred choice for handling asynchronous data.

To illustrate this, let’s look at an example of how rxResource() can be used to perform a backend call while applying RxJS operators like distinctUntilChanged and map:

rxUsers = rxResource<User[], string | undefined>({
request: () => this.query(),
loader: ({ request }) =>
this.#http.get<{ users: User[] }>(`${API_URL}/search?q=${request}`).pipe(
distinctUntilChanged(),
map(({ users }) => users),
catchError(() => {
throw Error('Unable to load!');
})
),
});
Practical Example and Hands-On Exploration
The power of resource() and rxResource() becomes evident when managing complex asynchronous workflows in your Angular application. By combining signals and these primitives, you can reduce boilerplate code while maintaining clarity and reactivity.

For example:

Dynamically update UI components based on isLoading() or error() states.
Create powerful search interfaces, as shown in the code above, that adapt in real-time as the user interacts.
To see these concepts in action, check out this interactive StackBlitz example:

StackBlitz
Edit description
stackblitz.com

In this demo, you’ll find:

A fully functional search bar integrated with the resource() API.
Examples of handling loading states, error handling, and real-time updates using signals.

---

# 3

Use rxResource() when you need to transform or process the response using RxJS operators.
Create a utility function that allows us to bridge the gap, applying RxJS operators to Signals before passing them to httpResource().
Let’s explore Approach #2 in detail.

🔄 From Signal to Observable and Back to Signal
Angular provides interoperability functions that help bridge the gap between Signals and Observables:

toObservable() → Converts a Signal into an Observable.
toSignal() → Converts an Observable back into a Signal.
By leveraging these utilities, we can apply RxJS operators like debounceTime() and distinctUntilChanged() while keeping httpResource() reactive.

🔗 Applying RxJS Operators to Signals
import { signal } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

inputQuery = signal<string>('');

inputQuery$ = toObservable(this.inputQuery).pipe(
distinctUntilChanged(),
debounceTime(400)
);

query = toSignal(this.inputQuery$);

httpUsers = httpResource<User[]>(() => `${API_URL}/search?q=${this.query()}`);
Here, we use a Signal to manage the input event and trigger API requests while leveraging an Observable to handle the stream flow efficiently.

Note:
This example works as expected, but since we are delaying the event and not the actual API request, the isLoading state could not reflect the truth.

🛠 Simplifying with a Utility Function
To avoid writing this logic repeatedly, we can create a utility function that applies debouncing and distinct filtering to any Signal:

import { Signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { distinctUntilChanged, debounceTime } from "rxjs";

export function debounceDistinctSignal<T>(signal: Signal<T>, time: number) {
const obs$ = toObservable(signal).pipe(
distinctUntilChanged(),
debounceTime(time)
);

return toSignal(obs$);
}
Now, we can simplify our original implementation like this:

import { httpResource } from "@angular/common/http";
import { debounceDistinctSignal } from 'signal-utils';

query = debounceDistinctSignal(this.inputQuery, 400);

httpUsers = httpResource<User[]>(() => `${API_URL}/search?q=${this.query()}`);
🎯 Try it in Action! 🚀
Want to see httpResource() in action? Check out this interactive StackBlitz demo, where you can:

✅ Experiment with httpResource() for API calls
✅ Test a search bar with debounce & distinctUntilChanged
✅ Compare side-by-side with rxResource() and resource()

StackBlitz
Edit description
stackblitz.com

📖 Summary & Next Steps
Here’s what we’ve learned in this article:

httpResource() simplifies API calls by integrating directly with HttpClient.
toObservable() and toSignal() provide interoperability between Signals and RxJS.
A custom utility function (debounceDistinctSignal()) helps clean up our code and makes this approach reusable.

---

# 4

Dependent state with linkedSignal
edit
IMPORTANT: linkedSignal is developer preview. It's ready for you to try, but it might change before it is stable.

You can use the signal function to hold some state in your Angular code. Sometimes, this state depends on some other state. For example, imagine a component that lets the user select a shipping method for an order:

@Component({/_ ... _/})
export class ShippingMethodPicker {
shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();
// Select the first shipping option by default.
selectedOption = signal(this.shippingOptions()[0]);
changeShipping(newOptionIndex: number) {
this.selectedOption.set(this.shippingOptions()[newOptionIndex]);
}
}
check
In this example, the selectedOption defaults to the first option, but changes if the user selects another option. But shippingOptions is a signal— its value may change! If shippingOptions changes, selectedOption may contain a value that is no longer a valid option.

The linkedSignal function lets you create a signal to hold some state that is intrinsically linked to some other state. Revisiting the example above, linkedSignal can replace signal:

@Component({/_ ... _/})
export class ShippingMethodPicker {
shippingOptions: Signal<ShippingMethod[]> = getShippingOptions();
// Initialize selectedOption to the first shipping option.
selectedOption = linkedSignal(() => this.shippingOptions()[0]);
changeShipping(index: number) {
this.selectedOption.set(this.shippingOptions()[index]);
}
}
check
linkedSignal works similarly to signal with one key difference— instead of passing a default value, you pass a computation function, just like computed. When the value of the computation changes, the value of the linkedSignal changes to the computation result. This helps ensure that the linkedSignal always has a valid value.

The following example shows how the value of a linkedSignal can change based on its linked state:

const shippingOptions = signal(['Ground', 'Air', 'Sea']);
const selectedOption = linkedSignal(() => shippingOptions()[0]);
console.log(selectedOption()); // 'Ground'
selectedOption.set(shippingOptions()[2]);
console.log(selectedOption()); // 'Sea'
shippingOptions.set(['Email', 'Will Call', 'Postal service']);
console.log(selectedOption()); // 'Email'
check
On this page
Accounting for previous state
Custom equality comparison

arrow_upward_alt
Back to the top
Accounting for previous state
In some cases, the computation for a linkedSignal needs to account for the previous value of the linkedSignal.

In the example above, selectedOption always updates back to the first option when shippingOptions changes. You may, however, want to preserve the user's selection if their selected option is still somewhere in the list. To accomplish this, you can create a linkedSignal with a separate source and computation:

interface ShippingMethod {
id: number;
name: string;
}
@Component({/_ ... _/})
export class ShippingMethodPicker {
constructor() {
this.changeShipping(2);
this.changeShippingOptions();
console.log(this.selectedOption()); // {"id":2,"name":"Postal Service"}
}
shippingOptions = signal<ShippingMethod[]>([
{ id: 0, name: 'Ground' },
{ id: 1, name: 'Air' },
{ id: 2, name: 'Sea' },
]);
selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
// `selectedOption` is set to the `computation` result whenever this `source` changes.
source: this.shippingOptions,
computation: (newOptions, previous) => {
// If the newOptions contain the previously selected option, preserve that selection.
// Otherwise, default to the first option.
return (
newOptions.find((opt) => opt.id === previous?.value.id) ?? newOptions[0]
);
},
});
changeShipping(index: number) {
this.selectedOption.set(this.shippingOptions()[index]);
}
changeShippingOptions() {
this.shippingOptions.set([
{ id: 0, name: 'Email' },
{ id: 1, name: 'Sea' },
{ id: 2, name: 'Postal Service' },
]);
}
}
check
When you create a linkedSignal, you can pass an object with separate source and computation properties instead of providing just a computation.

The source can be any signal, such as a computed or component input. When the value of source changes, linkedSignal updates its value to the result of the provided computation.

The computation is a function that receives the new value of source and a previous object. The previous object has two properties— previous.source is the previous value of source, and previous.value is the previous result of the computation. You can use these previous values to decide the new result of the computation.

Custom equality comparison
linkedSignal, as any other signal, can be configured with a custom equality function. This function is used by downstream dependencies to determine if that value of the linkedSignal (result of a computation) changed:

const activeUser = signal({id: 123, name: 'Morgan', isAdmin: true});
const activeUserEditCopy = linkedSignal(() => activeUser(), {
// Consider the user as the same if it's the same `id`.
equal: (a, b) => a.id === b.id,
});
// Or, if separating `source` and `computation`
const activeUserEditCopy = linkedSignal({
source: activeUser,
computation: user => user,
equal: (a, b) => a.id === b.id,
});

---

# 5

A guide to HTTP calls in Angular using httpResource()
Angular 19.2 introduces a new function called httpResource(). Let’s dive in!

By cexbrayat

Feb 20, 2025 12:00 AM3 min. readView original
Angular v19.2 introduced a dedicated (and experimental) function to create resources that use HTTP requests: httpResource() in the @angular/common/http package.

This function uses HttpClient under the hood, allowing us to use our usual interceptors, testing utilities, etc.

The most basic usage is to call this function with the URL from which you want to fetch data:

readonly
usersResource
=
httpResource
<
Array
<
UserModel

> > (
> > '
> > /users
> > '
> > );
> > httpResource() returns an HttpResourceRef with the same properties as ResourceRef, the type returned by resource(), as it is built on top of it (check out our blog post about Angular v19.0 to learn more about resource()):

value is a signal that contains the deserialized JSON response body;
status is a signal that contains the resource status (idle, loading, error, resolved, etc.);
error is a signal that contains the error if the request fails;
isLoading is a signal that indicates if the resource is loading;
reload() is a method that allows you to reload the resource;
update() and set() are methods that allow you to change the value of the resource;
asReadonly() is a method that allows you to get a read-only version of the resource;
hasValue() is a method that allows you to know if the resource has a value;
destroy() is a method that allows you to stop the resource.
It also contains a few more properties specific to HTTP resources:

statusCode is a signal that contains the status code of the response as a number;
headers is a signal that contains the headers of the response as HttpHeaders;
progress is a signal that contains the download progress of the response as a HttpProgressEvent.
It is also possible to define a reactive resource by using a function that returns the request as a parameter. If the function uses a signal, the resource will automatically reload when the signal changes:

readonly
sortOrder
=
signal
<
'
asc
'
|
'
desc
'

> (
> '
> asc
> '
> );
> readonly

# sortedUsersResource

httpResource
<
Array
<
UserModel

> > (()
> > =>
> > `/users?sort=
${
this
.
sortOrder
()}
`
> > );
> > When using a reactive request, the resource will automatically reload when a signal used in the request changes. If you want to skip the reload, you can return undefined from the request function (as for resource()).

If you need more fine-grained control over the request, you can also pass an HttpResourceRequest object to the httpResource() function, or a function that returns an HttpResourceRequest object in case you want to make the request reactive.

This object must have a url property and can have other options like method (GET by default), params, headers, reportProgress, etc. If you want to make the request reactive, you can use signals in the url, params or headers properties.

The above example would then look like:

readonly
sortedUsersResource
=
httpResource
<
Array
<
UserModel

> > (()
> > =>
> > ({
> > url
> > :
> > `/users`
> > ,
> > params
> > :
> > {
> > sort
> > :
> > this
> > .
> > sortOrder
> > ()
> > },
> > headers
> > :
> > new
> > HttpHeaders
> > ({
> > '
> > X-Custom-Header
> > '
> > :
> > this
> > .
> > customHeader
> > ()
> > })
> > }));
> > You can of course send a body with the request, for example for a POST/PUT request, using the body property of the request object. Note that, as we create the resource in a method, we have to pass the injector in the options as a second argument:

# injector

inject
(
Injector
);
filterUserResource
:
HttpResourceRef
<
UserModel
|
undefined

> |
> undefined
> ;
> filterUser
> ()
> {
> this
> .

# filterUserResource

httpResource
<
UserModel

> (
> {
> url
> :
> `/users`
> ,
> method
> :
> '
> POST
> '
> ,
> body
> :
> {
> name
> :
> '
> JB
> '
> }
> },
> {
> injector
> :
> this
> .
> injector
> }
> );
> Note that we will probably keep using the HttpClient for mutations.

In these options, you can also define:

defaultValue, a default value of the resource, to use when idle, loading, or in error;
an equal function that defines the equality of two values;
a map function that allows you to transform the response before setting it in the resource.
It is also possible to request something else than JSON, by using the httpResource.text(), httpResource.blob() or httpResource.arrayBuffer() functions.

Some of you may get a feeling of déjà vu with all this, as it’s quite similar to the TanStack Query library, I must insist that this is experimental and will probably evolve in the future. Let’s see what the RFC process will bring us!

Update: the RFCs are out for Resource Architecture and Resource APIS.

All our materials (ebook, online training and training) are up-to-date with these changes if you want to learn more!

---

# 6

What’s new in Angular 19.2?
Angular 19.2 is out!

By cexbrayat

Feb 26, 2025 12:00 AM4 min. readView original
Angular 19.2.0 is here!

Angular logo

This is a minor release with some nice features: let’s dive in!

Angular the documentary
This is not really linked to Angular v19.2, but it’s worth mentioning that the Honeypot channel released a documentary retracing the history of Angular, with interviews of the Angular team members (old and new):

👉 Documentary on youtube

TypeScript 5.8 support
Angular v19.2 now supports TypeScript 5.8, which is still in RC but should be out soon. This means you’ll be able to use the latest version of TypeScript in your Angular applications. You can check out the TypeScript 5.8 release notes to learn more about the new features.

resource() and rxResource() changes
Some changes happened in the recently introduced resource and rxResource APIs. resource was introduced in Angular 19.0 as an experimental API to handle asynchronous resources in Angular applications:

list
():
ResourceRef
<
Array
<
UserModel

> |
> undefined
>
> {
> return
> resource
> ({
> loader
> :
> async
> ()
> =>
> {
> const

# response

await
fetch
(
'
/users
'
);
return
(
await
response
.
json
())
as
Array
<
UserModel

> ;
> }
> });
> }
> Angular v19.2 adds the possibility to define a defaultValue option that will be used as the initial value of the resource or when the resource is in error (instead of undefined by default):

list
():
ResourceRef
<
Array
<
UserModel

> > {
> > return
> > resource
> > ({
> > // 👇 used when idle, loading, or in error
> > defaultValue
> > :
> > [],
> > loader
> > :
> > async
> > ()
> > =>
> > {
> > const

# response

await
fetch
(
'
/users
'
);
return
(
await
response
.
json
())
as
Array
<
UserModel

> ;
> }
> });
> }
> Angular v19.2 also added the possibility to create resources with streamed response data. A streaming resource is defined with a stream option instead of a loader option. This stream function returns a promise of a signal (yes, I needed to read it twice as well). The signal value must be of type ResourceStreamItem: an object with a value or an error property. When the promise is resolved, the loader can continue to update that signal over time, and the resource will update its value and error every time the signal’s item changes.

You can build this stream yourself, using a WebSocket for example. We can also imagine that some libraries such as Firebase could provide a stream function that would be directly usable:

list
():
ResourceRef
<
Array
<
UserModel

> |
> undefined
>
> {
> return
> resource
> ({
> // firebaseCollection does not exist in real-life
> stream
> :
> async
> ({
> abortSignal
> })
> =>
> await
> firebaseCollection
> (
> '
> users
> '
> ,
> abortSignal
> )
> });
> }
> This stream feature had been leveraged by the rxResource API, and you can now have a stream of values by returning an observable that emits several times. The resource will be updated every time a new value is emitted, whereas only the first value was emitted when introduced in Angular v19.

readonly
sortOrder
=
signal
<
'
asc
'
|
'
desc
'

> (
> '
> asc
> '
> );
> readonly

# usersResource

rxResource
({
request
:
()
=>
({
sort
:
this
.
sortOrder
()
}),
// 👇 stream that fetches the value now and every 10s
loader
:
({
request
})
=>
timer
(
0
,
10000
).
pipe
(
switchMap
(()
=>
this
.
httpClient
.
get
<
Array
<
UserModel

> > (
> > '
> > /users
> > '
> > ,
> > {
> > params
> > :
> > {
> > sort
> > :
> > request
> > .
> > sort
> > }
> > }))
> > )
> > });
> > New httpResource() API!
> > The main feature of this release is the introduction of the httpResource API. This API allows you to easily create resources that fetch data from an HTTP endpoint.

We wrote a dedicated blog post to explain how to use it:

👉 A guide to HTTP calls with httpResource()

The official RFCs for Resource Architecture and Resource APIS are also out if you’re curious.

Template strings in templates
The Angular compiler now supports template strings in templates:

<p>
{{ `Hello, ${name()}!` }}
</p>
<button
[
class
]
=
"`btn-${theme()}`"
>
Toggle
</button>
Here name and theme are signals that contain strings. You can even use pipes in the dynamic part of the template string:

<p>
{{ `Hello, ${name() | uppercase}!` }}
</p>
git This is a nice addition and I hope we’ll see arrow functions in templates soon!

A migration has been added to convert void elements to self-closing tags. This is just a cosmetic change, and some of you may have already done it via angular-eslint and its prefer-self-closing-tags rule.

If that’s not the case for you, you can run:

ng generate
@angular
/
core
:
self

- closing
- tag
  Forms validators
  The Validators.required, Validators.minLength, and Validators.maxLength validators now work with Set in addition to Array and string:

const
atLeastTwoElementsValidator
=
Validators
.
minLength
(
2
);
// minLength error before v19.2
atLeastTwoElementsValidator
(
new
FormControl
(
"
a
"
));
// string
atLeastTwoElementsValidator
(
new
FormControl
([
"
a
"
]));
// Array
// 👇 NEW in v19.2! minLength error as well with a Set
atLeastTwoElementsValidator
(
new
FormControl
(
new
Set
([
"
a
"
])));
// Set
Animation package
The @angular/animations package is slowly being retired: there has been no major update since its author left the Angular team a few years ago, and it is not actively maintained anymore. The team has removed dependencies on it in most packages (and in Angular Material as well), which means that you now safely remove it from your project if you don’t use it directly. To reflect that, the project skeleton generated by the CLI does not include it anymore in v19.2.

Angular CLI
AoT support for Karma, Jest, and WTR
It is now possible to run your tests with AOT compilation with Karma, Jest, and Web Test Runner, instead of the default JIT compilation that has been used so far. This is great as it can catch issues in your test components (missing required inputs, etc).

Sadly, some test features are not available with AOT compilation in tests. For example, TestBed.overrideComponent, TestBed.overrideTemplate, etc are not supported as they rely on JIT compilation. I really hope that we’ll soon have new TestBed APIs that work with AOT compilation!

In the meantime, you can give it a try by adding the aot: true option in your angular.json configuration file.

Karma builder
The Karma application builder (introduced in v19) has been moved to the @angular/build package. This means you can now only use this dependency and get rid of the @angular-devkit/build-angular one.

SSR
provideServerRoutesConfig has been deprecated and renamed provideServerRouting, and its appShellRoute option has been replaced with a withAppShell option, to make the API similar to the other in Angular.

Before:

provideServerRoutesConfig
(
serverRoutes
,
{
appShellRoute
:
""
});
After:

provideServerRouting
(
serverRoutes
,
withAppShell
(
AppComponent
));
A note-worthy new feature: routes defined with a matcher are now supported by Angular SSR, allowing us to define their render mode. Note that it can only be Server or Client for these routes but not Prerender.

Summary
That’s all for this release. The next one should be v20, and we hope to see some news on the “forms with signals” 🤞 Stay tuned!

## CodeCompanion (Anthropic)

Could you share the articles you're referring to? Without them, I can make some educated guesses about Angular 17+ and its new features:

1. If you're using Angular 17+'s built-in HTTP resource feature, try:

```typescript
import { httpClient } from '@angular/common/http';
import { resourceConfig, withRefresh } from '@angular/core';

// In your component:
private searchResource = resourceConfig({
  endpoint: () => {
    const term = this.debouncedSearchTerm();
    return term.length >= 2
      ? `/api/search?q=${encodeURIComponent(term)}`
      : undefined;
  },
  transform: (response: { hits: ElasticsearchHit[] }) => response,
  defaultValue: { hits: [] }
});
```

Could you share the articles you were going to reference? That would help me provide a more accurate solution based on the specific Angular version and features you're using.

## Me

> Sharing:
>
> - <buf>deenji/src/app/pages/home/sticky-search.component.ts</buf>

please read this

Seamless data fetching with httpResource
Matthieu Riegler
Angular Blog
Matthieu Riegler

·
Follow

Published in
Angular Blog

·
4 min read
·
Mar 7, 2025
516

7

Brown dog with a large stick in the middle of a forrest.
Photo by Jamie Street on Unsplash
Fantastic new APIs are coming to Angular. Two years ago, we proposed making Angular a reactive web framework powered by signals. Since then, the team has shipped a number of signal-based features in the framework: reactive primitives like signal & computed, reactive inputs including model, signal queries, bidirectional RxJS conversion utilities, and migration tooling.

We have a solid foundation for reactivity in Angular. Now, we’re ready to begin the next phase of the reactivity journey: the world of asynchronous state. In v19 we shipped the experimental resource() API for developers to try out in advance of the dedicated RFC.

The resource API makes it possible to expose results of asynchronous operations as signals. For most applications, developers make HTTP requests for the data their applications need. We recognize this and have built a new API to help facilitate this primary use case — introducing httpResource 🎉.

HttpResource
httpResource is built on top of the resource primitive and uses HttpClient as loader. It acts as a frontend for @angular/common/http. It makes HTTP requests through the Angular HTTP stack, including interceptors. As the underlying stack remains the same, testing will rely on the same tools.

Here we are defining an httpResource with currentUserId as a reactive parameter.

currentUserId = getCurrentUserId(); // returns a signal

user = httpResource(() => `/api/user/${currentUserId()}`); // A reactive function as argument
By default, an httpResource will perform a GET request and return an unknown typed JSON response.

It is important to note that httpResource differs from the HttpClient as it initiates the request eagerly (unlike the HttpClient Observable-based requests which must be subscribed).

Like resource, it configures a reactive request. If any of the source signals in the request computation change, a new HTTP request will be made.

For more advanced requests, it is possible to define a request object similar to HttpClient‘s request.

user = httpResource(() => ({
url: `/api/user/${currentUserId()}`,
method: 'GET',
headers: {
'X-Special': 'true',
},
params: {
'fast': 'yes',
},
reportProgress: true,
withCredentials: true,
transferCache: true,
}));
While the resource pattern is meant only for retrieving asynchronous data, httpResource will allow any request method (like POST in the previous example). This still doesn’t mean that you should be using httpResource to change data on the server. For instance, if you need to submit form data, use the HttpClient methods.

An httpResource will return and parse the response as JSON but it is possible to use it for other return types.

The API has multiple dedicated methods available for other response types:

httpResource.text(() => ({ … })); // returns a text in value()

httpResource.blob(() => ({ … })); // returns a Blob object in value()

httpResource.arrayBuffer(() => ({ … })); // returns an ArrayBuffer in value()
Shape of an HttpResource
An httpResource , similar to other `resource`, exposes several signals:

value() — which contains the result of the http request (when successful) and is programmatically overwritable
status() — with the status of the resource (idle, loading, error etc)
error() — with the request error / parsing error
isLoading() — which is true while the request is pending
It also includes dedicated signals for metadata about the response:

​​headers() — with the response’s headers
statusCode() — with the response’s status code
progress() — with the progress of the request (if required in the request object)
These new signals streamline the writing of requests by exposing this useful information without requiring a specific argument like for the HttpClient to request the HttpResponse.

Embracing the Ecosystem for Type Safety
When performing http requests we often want to ensure that the data we receive conforms the shape that we expect. This is commonly known as schema validation.

In the JavaScript ecosystem we often reach out for battle-tested libraries like Zod or Valibot for schema validation. The httpResource offers direct integration for those libraries by using the parse parameter. The returned type of this parse function will provide the type to the resource itself, ensuring type safety alongside the schema validation.

The following example uses Zod to parse and validate the response from the StarWars API. The resource is then typed the same as the output type of the Zod’s parsing.

export class AppComponent {
id = signal(1);

swPersonResource = httpResource(
() => `https://swapi.dev/api/people/${this.id()}`,
{ parse: starWarsPersonSchema.parse }
);
}

const starWarsPersonSchema = z.object({
name: z.string(),
height: z.number({ coerce: true }),
edited: z.string().datetime(),
films: z.array(z.string()),
});
Demo on Stackblitz

Experimental API
The httpResource is available as a part of the Angular v19.2 release. This is an experimental API and is not ready for production because the shape of this API can still change before it is promoted to stable. With that in mind, we would love for you to try out the API and let us know what you think. You can learn more about this API, resource and more in the RFC on GitHub.

Thank you for being a part of the Angular community and we look forward to continuing the reactivity journey together. Happy coding!

## CodeCompanion (Anthropic)

Ah, now I understand. The error is because we're using the new Angular 19.2 `httpResource` feature incorrectly. Here's how to fix it:

1. First, correct the import:

```typescript
import { httpResource } from '@angular/common/http/resource';
```

2. Then, modify your searchResource implementation to use the correct type and parsing:

```typescript
public searchResource = httpResource<{ hits: ElasticsearchHit[] }>(
  () => {
    const term = this.debouncedSearchTerm();
    return term.length >= 2
      ? {
          url: `/api/search?q=${encodeURIComponent(term)}`,
          method: 'GET'
        }
      : undefined;
  },
  {
    defaultValue: { hits: [] }
  }
);
```

The key differences are:

- Using the correct import path
- Passing a request configuration object instead of just a URL
- Using the proper typing for the response

Would you like me to help you adjust other parts of the component to work with this new implementation?

now getting this: ts: Cannot find module '@angular/common/http/resource' or its corresponding type declarations.
