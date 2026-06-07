import Pitch from "@/components/Pitch";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">TACTICO</h1>
      <div className="w-full max-w-4xl h-96 bg-green-500 relative">
        <Pitch />
      </div>
    </main>
  );
}