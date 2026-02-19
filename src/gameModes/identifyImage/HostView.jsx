// IdentifyImage HostView — Placeholder
// The default QA host flow in HostScreen already renders image_path.
// This component is here for registry completeness and future extraction.
export default function IdentifyImageHostView({ room, questions, players }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
      <p className="text-gray-400">Wer oder was ist das? – Host-Ansicht</p>
    </div>
  );
}
