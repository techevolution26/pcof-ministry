'use client'


export default function Contact(){
return (
<section>
<h2 className="text-2xl font-bold mb-4">Contact</h2>
<form className="max-w-md space-y-3">
<input className="w-full p-2 border rounded" placeholder="Your name" />
<input className="w-full p-2 border rounded" placeholder="Your email" />
<textarea className="w-full p-2 border rounded" placeholder="Message" />
<button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
</form>
</section>
)
}