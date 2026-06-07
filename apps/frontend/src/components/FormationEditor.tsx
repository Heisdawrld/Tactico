"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Player, PlayerPosition } from "@/types/player";
import { Club } from "@/types/club";
import { Formation, formationPositions, positionRoles } from "@/types/tactics";
import { PlayerRole, positionToRoles, roleDescriptions } from "@/types/roles";

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
  const [lineup, setLineup] = useState<
    { player: Player | null; position: string; x: number; y: number }[]
  >([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<number, PlayerRole>>({});

  // Initialize lineup when formation changes
  useEffect(() => {
    const formation = formationPositions[selectedFormation];
    const newLineup = formation.map((pos) => ({
      player: null,
      position: pos.position,
      x: pos.x,
      y: pos.y,
    }));
    setLineup(newLineup);
    onLineupChange(newLineup);
    onFormationChange(selectedFormation);
  }, [selectedFormation, onLineupChange, onFormationChange]);

  // Initialize PixiJS
  useEffect(() => {
    if (!pitchRef.current) return;

    const app = new PIXI.Application({
      width: pitchRef.current.clientWidth,
      height: pitchRef.current.clientHeight,
      backgroundColor: 0x2e7d32,
      antialias: true,
    });

    pitchRef.current.appendChild(app.view as HTMLCanvasElement);

    // Draw pitch lines
    const pitchLines = new PIXI.Graphics();
    pitchLines.lineStyle(2, 0xffffff);
    pitchLines.drawRect(0, 0, app.screen.width, app.screen.height);
    
    // Center line
    pitchLines.moveTo(app.screen.width / 2, 0);
    pitchLines.lineTo(app.screen.width / 2, app.screen.height);
    
    // Center circle
    pitchLines.drawCircle(
      app.screen.width / 2,
      app.screen.height / 2,
      50
    );
    
    // Penalty areas
    pitchLines.drawRect(
      app.screen.width * 0.1,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    pitchLines.drawRect(
      app.screen.width * 0.6,
      app.screen.height * 0.3,
      app.screen.width * 0.3,
      app.screen.height * 0.4
    );
    
    // Penalty spots
    pitchLines.beginFill(0xffffff);
    pitchLines.drawCircle(app.screen.width * 0.2, app.screen.height / 2, 3);
    pitchLines.drawCircle(app.screen.width * 0.8, app.screen.height / 2, 3);
    pitchLines.endFill();

    app.stage.addChild(pitchLines);

    // Store reference to app for cleanup
    const appRef = app;

    return () => {
      appRef.destroy(true);
    };
  }, []);

  // Update PixiJS when lineup changes
  useEffect(() => {
    if (!pitchRef.current) return;

    // Clear existing sprites
    const app = PIXI.Application.instances.find((a) => 
      a.view.parentElement === pitchRef.current
    );
    if (!app) return;

    // Remove all children except the pitch lines
    while (app.stage.children.length > 1) {
      app.stage.removeChild(app.stage.children[1]);
    }

    // Draw player positions
    lineup.forEach((pos, index) => {
      const sprite = new PIXI.Graphics();
      
      if (pos.player) {
        // Draw player circle with club color
        sprite.beginFill(club.homeKitColor || 0x00ff00);
        sprite.drawCircle(0, 0, 15);
        sprite.endFill();
        
        // Add player number
        const text = new PIXI.Text(pos.player.lastName, {
          fontSize: 10,
          fill: 0xffffff,
          align: "center",
        });
        text.anchor.set(0.5);
        text.y = -20;
        sprite.addChild(text);
        
        // Add role indicator
        const role = selectedRole[index];
        if (role) {
          const roleText = new PIXI.Text(role.substring(0, 3), {
            fontSize: 8,
            fill: 0x000000,
            align: "center",
          });
          roleText.anchor.set(0.5);
          roleText.y = 5;
          sprite.addChild(roleText);
        }
      } else {
        // Empty position
        sprite.beginFill(0x666666);
        sprite.drawCircle(0, 0, 15);
        sprite.endFill();
        
        const text = new PIXI.Text(pos.position, {
          fontSize: 10,
          fill: 0xffffff,
          align: "center",
        });
        text.anchor.set(0.5);
        sprite.addChild(text);
      }

      sprite.x = pos.x * app.screen.width;
      sprite.y = pos.y * app.screen.height;
      sprite.eventMode = "dynamic";
      sprite.cursor = "pointer";
      
      // Add click event to select position
      sprite.on("pointerdown", () => {
        setSelectedPlayerIndex(index);
      });

      app.stage.addChild(sprite);
    });
  }, [lineup, selectedRole, club.homeKitColor]);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
  };

  const handlePlayerSelect = (positionIndex: number, player: Player | null) => {
    const newLineup = [...lineup];
    newLineup[positionIndex].player = player;
    setLineup(newLineup);
    onLineupChange(newLineup);
    setSelectedPlayerIndex(null);
  };

  const handleRoleChange = (positionIndex: number, role: PlayerRole) => {
    setSelectedRole({ ...selectedRole, [positionIndex]: role });
  };

  const getAvailablePlayersForPosition = (position: string) => {
    const roles = positionRoles[position] || [];
    return players.filter((p) => roles.includes(p.position as PlayerPosition));
  };

  const getAvailableRolesForPosition = (position: string) => {
    return positionToRoles[position] || [];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Formation Editor</h2>
      
      {/* Formation Selector */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          {(["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as Formation[]).map(
            (formation) => (
              <button
                key={formation}
                onClick={() => handleFormationChange(formation)}
                className={`px-3 py-1 rounded-lg border-2 ${
                  selectedFormation === formation
                    ? "border-blue-500 bg-blue-600"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {formation}
              </button>
            )
          )}
        </div>
      </div>

      {/* Pitch */}
      <div
        ref={pitchRef}
        className="w-full h-96 bg-green-600 rounded-lg mb-4 relative overflow-hidden"
      ></div>

      {/* Lineup List */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-bold mb-2">Starting XI</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {lineup.map((pos, index) => {
            const availablePlayers = getAvailablePlayersForPosition(pos.position);
            const availableRoles = getAvailableRolesForPosition(pos.position);
            const currentPlayer = pos.player;
            const currentRole = selectedRole[index];

            return (
              <div
                key={index}
                className={`p-2 rounded-lg ${
                  selectedPlayerIndex === index ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{pos.position}</span>
                  <span className="text-xs text-gray-400">
                    ({pos.x * 100}%, {pos.y * 100}%)
                  </span>
                </div>
                
                {/* Player Selector */}
                <select
                  value={currentPlayer?.id || ""}
                  onChange={(e) => {
                    const playerId = parseInt(e.target.value);
                    const player = playerId 
                      ? availablePlayers.find((p) => p.id === playerId) 
                      : null;
                    handlePlayerSelect(index, player || null);
                  }}
                  className="w-full p-1 mb-1 rounded bg-gray-800 text-white"
                >
                  <option value="">-- Empty --</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName} ({player.overallRating})
                    </option>
                  ))}
                </select>

                {/* Role Selector */}
                {currentPlayer && availableRoles.length > 0 && (
                  <select
                    value={currentRole || ""}
                    onChange={(e) => handleRoleChange(index, e.target.value as PlayerRole)}
                    className="w-full p-1 rounded bg-gray-800 text-white text-sm"
                  >
                    <option value="">-- No Role --</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}

                {/* Player Info */}
                {currentPlayer && (
                  <div className="mt-1 text-xs text-gray-400">
                    <p>
                      Age: {currentPlayer.age} | 
                      Pace: {currentPlayer.pace} | 
                      Shooting: {currentPlayer.shooting}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Descriptions */}
      {selectedPlayerIndex !== null && lineup[selectedPlayerIndex].player && (
        <div className="mt-4 bg-gray-700 rounded-lg p-3 text-sm">
          <p className="font-medium mb-1">
            {lineup[selectedPlayerIndex].position} Position
          </p>
          <p className="text-gray-400">
            Click on a position to select a player or change their role.
          </p>
        </div>
      )}
    </div>
  );
}