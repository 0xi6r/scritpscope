// Add this to the ScriptItem component to show import badge
{script.type === 'imported' && (
  <div className="mt-2">
    <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
      📁 Imported: {script.fileName}
    </span>
  </div>
)}

{script.type === 'imported-url' && (
  <div className="mt-2">
    <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
      🔗 Imported URL
    </span>
  </div>
)}
