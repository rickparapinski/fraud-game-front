"use client";

const SCENES = {
  lobby: { folder: "city2", skyDuration: 40, layers: 6 },
  night: { folder: "city1", skyDuration: 60, layers: 5 },
  day:   { folder: "city5", skyDuration: 35, layers: 6 },
};

const KEYFRAMES = `
  @keyframes city-sky-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
`;

function Scene({ folder, skyDuration, layerCount, visible }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 2s ease" }}
    >
      {Array.from({ length: layerCount }, (_, i) => {
        const file = `${i + 1}.png`;
        const isSky = i === 0;
        return isSky ? (
          <div
            key={file}
            className="absolute bottom-0 left-0 flex flex-nowrap"
            style={{
              height: "100%",
              animationName: "city-sky-scroll",
              animationDuration: `${skyDuration}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          >
            {[0, 1].map((n) => (
              <img
                key={n}
                src={`/backgrounds/${folder}/${file}`}
                alt=""
                style={{
                  height: "100%",
                  width: "auto",
                  flexShrink: 0,
                  imageRendering: "pixelated",
                  display: "block",
                }}
              />
            ))}
          </div>
        ) : (
          <div
            key={file}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(/backgrounds/${folder}/${file})`,
              backgroundSize: "auto 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "bottom",
              imageRendering: "pixelated",
            }}
          />
        );
      })}
    </div>
  );
}

export default function CityBackground({ phase }) {
  const activeScene = phase === "night" ? "night" : phase === "day" ? "day" : "lobby";

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <style>{KEYFRAMES}</style>
      {Object.entries(SCENES).map(([key, scene]) => (
        <Scene
          key={key}
          folder={scene.folder}
          skyDuration={scene.skyDuration}
          layerCount={scene.layers}
          visible={activeScene === key}
        />
      ))}
      {/* Night darkening — fades in over the city during night phase */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: activeScene === "night" ? 1 : 0,
          transition: "opacity 2s ease",
        }}
      />
      {/* Office room overlay — dark walls frame the monitor, city shows through transparent windows */}
      <img
        src="/office-overlay.png"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "cover", imageRendering: "pixelated" }}
      />
    </div>
  );
}
