import ClubSelector from "@/components/ClubSelector";

export default function StartPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">TACTICO</h1>
        <p className="text-center text-gray-400 mb-8">
          The most immersive football manager game ever built.
        </p>
        <ClubSelector />
      </div>
    </main>
  );
}