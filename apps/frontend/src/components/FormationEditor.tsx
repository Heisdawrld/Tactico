"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Player, PlayerPosition } from "@/types/player";
import { Club } from "@/types/club";
import { Formation, formationPositions, positionRoles } from "@/types/tactics";
import { PlayerRole, positionToRoles } from "@/types/roles";

interface FormationEditorProps {
  club: Club;
  players: Player[];
  onLineupChange: (lineup: { player: Player | null; position: string; x: number; y: number }[]) => void;
  onFormationChange: (formation: Formation) => void;
}

export default function FormationEditor({
  club,
  players,
  onLineupChange,
  onFormationChange,
}: FormationEditorProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation>("4-4-2");
  const [lineup, setLineup] = useState<{ player: Player | null; position: string; x: number; y: number }[]>([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<number, PlayerRole>>({});

  useEffect(() => {
    const formation = formationPositions[selectedFormation];
    const newLineup = formation.map((pos) => ({ player: null, position: pos.position, x: pos.x, y: pos.y }));
    setLineup(newLineup);
    onLineupChange(newLineup);
    onFormationChange(selectedFormation);
  }, [selectedFormation, onLineupChange, onFormationChange]);

  useEffect(() => {
    if (!pitchRef.current) return;
    const app = new PIXI.Application({ width: pitchRef.current.clientWidth, height: pitchRef.current.clientHeight, backgroundColor: 0x1B5E20, antialias: true });
    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    const lines = new PIXI.Graphics();
    lines.lineStyle(1.5, 0xFFFFFF, 0.25);
    lines.drawRect(0, 0, app.screen.width, app.screen.height);
    lines.moveTo(app.screen.width / 2, 0);
    lines.lineTo(app.screen.width / 2, app.screen.height);
    lines.drawCircle(app.screen.width / 2, app.screen.height / 2, 40);
    lines.drawRect(app.screen.width * 0.1, app.screen.height * 0.3, app.screen.width * 0.3, app.screen.height * 0.4);
    lines.drawRect(app.screen.width * 0.6, app.screen.height * 0.3, app.screen.width * 0.3, app.screen.height * 0.4);
    app.stage.addChild(lines);

    const appRef = app;
    return () => { appRef.destroy(true); };
  }, []);

  useEffect(() => {
    if (!pitchRef.current) return;
    const app = PIXI.Application.instances.find((a) => a.view.parentElement === pitchRef.current);
    if (!app) return;
    while (app.stage.children.length > 1) app.stage.removeChild(app.stage.children[1]);

    lineup.forEach((pos, index) => {
      const sprite = new PIXI.Graphics();
      if (pos.player) {
        sprite.beginFill(club.homeKitColor || 0xC9A84C);
        sprite.drawCircle(0, 0, 14);
        sprite.endFill();
        const text = new PIXI.Text(pos.player.lastName, { fontSize: 9, fill: 0xFFFFFF, align: "center" });
        text.anchor.set(0.5); text.y = -20;
        sprite.addChild(text);
        const role = selectedRole[index];
        if (role) {
          const rt = new PIXI.Text(role.substring(0, 3), { fontSize: 7, fill: 0x000000, align: "center" });
          rt.anchor.set(0.5); rt.y = 4;
          sprite.addChild(rt);
        }
      } else {
        sprite.beginFill(0x444444);
        sprite.drawCircle(0, 0, 14);
        sprite.endFill();
        const text = new PIXI.Text(pos.position, { fontSize: 9, fill: 0xFFFFFF, align: "center" });
        text.anchor.set(0.5);
        sprite.addChild(text);
      }
      sprite.x = pos.x * app.screen.width;
      sprite.y = pos.y * app.screen.height;
      sprite.eventMode = "dynamic";
      sprite.cursor = "pointer";
      sprite.on("pointerdown", () => setSelectedPlayerIndex(index));
      app.stage.addChild(sprite);
    });
  }, [lineup, selectedRole, club.homeKitColor]);

  const handlePlayerSelect = (positionIndex: number, player: Player | null) => {
    const newLineup = [...lineup];
    newLineup[positionIndex].player = player;
    setLineup(newLineup);
    onLineupChange(newLineup);
    setSelectedPlayerIndex(null);
  };

  const getAvailablePlayersForPosition = (position: string) => {
    const roles = positionRoles[position] || [];
    return players.filter((p) => roles.includes(p.position as PlayerPosition));
  };

  const getAvailableRolesForPosition = (position: string) => positionToRoles[position] || [];

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-offwhite">Formation</h2>
        <div className="flex gap-1">
          {(["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as Formation[]).map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFormation(f)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                selectedFormation === f ? "bg-gold/20 text-gold ring-1 ring-gold/30" : "bg-white/[0.04] text-offwhite-500 hover:bg-white/[0.06]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div ref={pitchRef} className="w-full h-96 rounded-lg mb-4 relative overflow-hidden" />

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <p className="section-header">Starting XI</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {lineup.map((pos, index) => {
            const availablePlayers = getAvailablePlayersForPosition(pos.position);
            const availableRoles = getAvailableRolesForPosition(pos.position);
            const currentPlayer = pos.player;
            const currentRole = selectedRole[index];

            return (
              <div key={index} className={`p-2 rounded-lg transition-all duration-150 ${
                selectedPlayerIndex === index ? "bg-gold/10 ring-1 ring-gold/20" : "bg-white/[0.03]"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-offwhite-300">{pos.position}</span>
                  {currentPlayer && (
                    <span className="text-[9px] font-bold text-gold">{currentPlayer.overallRating}</span>
                  )}
                </div>
                <select
                  value={currentPlayer?.id || ""}
                  onChange={(e) => {
                    const playerId = parseInt(e.target.value);
                    const player = playerId ? availablePlayers.find((p) => p.id === playerId) : null;
                    handlePlayerSelect(index, player || null);
                  }}
                  className="w-full p-1 rounded bg-charcoal-50 text-offwhite text-[11px] border border-white/[0.06]"
                >
                  <option value="">-- Empty --</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName} ({player.overallRating})
                    </option>
                  ))}
                </select>
                {currentPlayer && availableRoles.length > 0 && (
                  <select
                    value={currentRole || ""}
                    onChange={(e) => setSelectedRole({ ...selectedRole, [index]: e.target.value as PlayerRole })}
                    className="w-full p-1 mt-1 rounded bg-charcoal-50 text-offwhite-500 text-[10px] border border-white/[0.06]"
                  >
                    <option value="">-- Role --</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
