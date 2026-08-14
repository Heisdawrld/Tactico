'use client';

import { useMemo } from 'react';
import {
  calculateOffsideReference,
  createFormationAssignments,
  type FormationAssignment,
} from '@tactico/simulation-engine/spatial';
import type {
  EntityId,
  MatchActorFrame,
  MatchFrame,
  MatchManifest,
  MatchParticipant,
  MatchVector3,
} from '@tactico/simulation-engine/protocol';

export interface DiagnosticLayers {
  decisions: boolean;
  labels: boolean;
  motion: boolean;
  offside: boolean;
  pressure: boolean;
  shape: boolean;
}

interface MatchLabPitchProps {
  frame: MatchFrame;
  layers: DiagnosticLayers;
  manifest: MatchManifest;
  onSelectActor: (id: EntityId) => void;
  selectedActorId: EntityId | null;
}

const VIEW_MARGIN_X = 6.5;
const VIEW_MARGIN_Y = 5;
const VIEW_WIDTH = 118;
const VIEW_HEIGHT = 78;

const HOME_COLOR = '#54a8ff';
const AWAY_COLOR = '#ff596d';
const GOALKEEPER_COLOR = '#f8c84a';
const REFEREE_COLOR = '#ddff3f';
const ASSISTANT_COLOR = '#42e8e0';

const toView = (position: MatchVector3): MatchVector3 => ({
  x: position.x + VIEW_MARGIN_X,
  y: position.y + VIEW_MARGIN_Y,
  z: position.z,
});

const participantColor = (
  participant: MatchParticipant,
  manifest: MatchManifest,
): string => {
  if (participant.kind === 'referee') return REFEREE_COLOR;
  if (participant.kind === 'assistant_referee') return ASSISTANT_COLOR;
  if (participant.role === 'GK') return GOALKEEPER_COLOR;
  return participant.teamId === manifest.home.teamId ? HOME_COLOR : AWAY_COLOR;
};

const formatId = (id: EntityId): string => String(id);

function actorLabel(participant: MatchParticipant, actor: MatchActorFrame): string {
  const speed = Math.hypot(actor.velocity.x, actor.velocity.y).toFixed(1);
  return `${participant.displayName}, ${String(participant.role)}, ${actor.locomotion}, ${speed} metres per second`;
}

export function MatchLabPitch({
  frame,
  layers,
  manifest,
  onSelectActor,
  selectedActorId,
}: MatchLabPitchProps) {
  const participants = useMemo(
    () => new Map(manifest.participants.map(participant => [participant.id, participant])),
    [manifest],
  );
  const anchors = useMemo(
    () => createFormationAssignments(manifest),
    [manifest],
  );
  const actors = useMemo(
    () => new Map(frame.actors.map(actor => [actor.id, actor])),
    [frame],
  );
  const offsideReferences = useMemo(() => {
    const nearAssistant = manifest.participants.find(
      participant => participant.role === 'assistant_near',
    );
    const farAssistant = manifest.participants.find(
      participant => participant.role === 'assistant_far',
    );
    return [
      {
        assistant: nearAssistant ? actors.get(nearAssistant.id) : undefined,
        color: ASSISTANT_COLOR,
        reference: calculateOffsideReference(
          manifest,
          frame.actors,
          frame.ball.position.x,
          manifest.home.teamId,
        ),
      },
      {
        assistant: farAssistant ? actors.get(farAssistant.id) : undefined,
        color: '#f7d154',
        reference: calculateOffsideReference(
          manifest,
          frame.actors,
          frame.ball.position.x,
          manifest.away.teamId,
        ),
      },
    ];
  }, [actors, frame.actors, frame.ball.position.x, manifest]);

  const pitchX = VIEW_MARGIN_X;
  const pitchY = VIEW_MARGIN_Y;
  const pitchLength = manifest.pitch.lengthM;
  const pitchWidth = manifest.pitch.widthM;
  const centreX = pitchX + pitchLength / 2;
  const centreY = pitchY + pitchWidth / 2;
  const activeFlightLabel = frame.ball.flight?.kind === 'shot' ? 'SHOT' : 'PASS';

  return (
    <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#07140d] shadow-2xl">
      <p id="match-lab-pitch-description" className="sr-only">
        A top-down diagnostic football pitch showing twenty-two players, one referee,
        two assistant referees, the ball, and enabled tactical overlays.
      </p>

      <svg
        aria-describedby="match-lab-pitch-description"
        aria-label="TACTICO deterministic match simulation pitch"
        className="block h-full min-h-[420px] w-full bg-[#06110c]"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <defs>
          <linearGradient id="match-lab-grass" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#164d2d" />
            <stop offset="0.5" stopColor="#1b6036" />
            <stop offset="1" stopColor="#164d2d" />
          </linearGradient>
          <pattern id="match-lab-stripes" height={pitchWidth} patternUnits="userSpaceOnUse" width="10.5">
            <rect fill="rgba(255,255,255,0.025)" height={pitchWidth} width="5.25" />
          </pattern>
          <filter id="match-lab-ball-shadow" height="200%" width="200%" x="-50%" y="-50%">
            <feGaussianBlur stdDeviation="0.35" />
          </filter>
          <marker id="match-lab-arrow" markerHeight="4" markerWidth="4" orient="auto" refX="3" refY="2">
            <path d="M0,0 L4,2 L0,4 Z" fill="context-stroke" />
          </marker>
          <clipPath id="match-lab-pitch-clip">
            <rect height={pitchWidth} width={pitchLength} x={pitchX} y={pitchY} />
          </clipPath>
        </defs>

        <rect
          fill="url(#match-lab-grass)"
          height={pitchWidth}
          rx="0.4"
          width={pitchLength}
          x={pitchX}
          y={pitchY}
        />
        <rect
          fill="url(#match-lab-stripes)"
          height={pitchWidth}
          width={pitchLength}
          x={pitchX}
          y={pitchY}
        />

        <g fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="0.22">
          <rect height={pitchWidth} width={pitchLength} x={pitchX} y={pitchY} />
          <line x1={centreX} x2={centreX} y1={pitchY} y2={pitchY + pitchWidth} />
          <circle cx={centreX} cy={centreY} r="9.15" />
          <circle cx={centreX} cy={centreY} fill="rgba(255,255,255,0.9)" r="0.32" />

          <rect height="40.32" width="16.5" x={pitchX} y={pitchY + 13.84} />
          <rect height="40.32" width="16.5" x={pitchX + pitchLength - 16.5} y={pitchY + 13.84} />
          <rect height="18.32" width="5.5" x={pitchX} y={pitchY + 24.84} />
          <rect height="18.32" width="5.5" x={pitchX + pitchLength - 5.5} y={pitchY + 24.84} />
          <circle cx={pitchX + 11} cy={centreY} fill="rgba(255,255,255,0.9)" r="0.26" />
          <circle cx={pitchX + pitchLength - 11} cy={centreY} fill="rgba(255,255,255,0.9)" r="0.26" />
          <path d={`M ${pitchX + 16.5} ${pitchY + 26.68} A 9.15 9.15 0 0 1 ${pitchX + 16.5} ${pitchY + 41.32}`} />
          <path d={`M ${pitchX + pitchLength - 16.5} ${pitchY + 26.68} A 9.15 9.15 0 0 0 ${pitchX + pitchLength - 16.5} ${pitchY + 41.32}`} />
        </g>

        <g fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="0.28">
          <rect height="7.32" width="2.2" x={pitchX - 2.2} y={centreY - 3.66} />
          <rect height="7.32" width="2.2" x={pitchX + pitchLength} y={centreY - 3.66} />
        </g>

        {layers.shape && (
          <g aria-label="Formation anchors" clipPath="url(#match-lab-pitch-clip)">
            {[...anchors.values()].map((assignment: FormationAssignment) => {
              const position = toView(assignment.basePosition);
              const color = assignment.participant.teamId === manifest.home.teamId
                ? HOME_COLOR
                : AWAY_COLOR;
              return (
                <g key={`anchor-${formatId(assignment.participant.id)}`} opacity="0.45">
                  <circle cx={position.x} cy={position.y} fill="none" r="1.15" stroke={color} strokeDasharray="0.8 0.6" strokeWidth="0.18" />
                  <line stroke={color} strokeWidth="0.15" x1={position.x - 0.7} x2={position.x + 0.7} y1={position.y} y2={position.y} />
                  <line stroke={color} strokeWidth="0.15" x1={position.x} x2={position.x} y1={position.y - 0.7} y2={position.y + 0.7} />
                </g>
              );
            })}
          </g>
        )}

        {layers.offside && offsideReferences.map(({ assistant, color, reference }) => {
            const referenceX = reference.x + VIEW_MARGIN_X;
            const assistantPosition = assistant ? toView(assistant.position) : null;
            return (
              <g key={`offside-${String(reference.defendingTeamId)}`} opacity="0.76">
                <line
                  stroke={color}
                  strokeDasharray="1.2 0.8"
                  strokeWidth="0.2"
                  x1={referenceX}
                  x2={referenceX}
                  y1={pitchY}
                  y2={pitchY + pitchWidth}
                />
                {assistantPosition && (
                  <line
                    stroke={color}
                    strokeDasharray="0.55 0.45"
                    strokeWidth="0.18"
                    x1={assistantPosition.x}
                    x2={referenceX}
                    y1={assistantPosition.y}
                    y2={assistantPosition.y}
                  />
                )}
                <text fill={color} fontSize="1.15" textAnchor="middle" x={referenceX} y={pitchY - 1.2}>
                  {`OFFSIDE · ${reference.source === 'second_last_defender' ? '2ND LAST' : reference.source.toUpperCase()}`}
                </text>
              </g>
            );
          })}

        {layers.decisions && frame.ball.flight && (() => {
          const start = toView(frame.ball.position);
          const end = toView(frame.ball.flight.targetPosition);
          return (
            <g aria-label="Authoritative ball flight target">
              <line
                markerEnd="url(#match-lab-arrow)"
                opacity="0.9"
                stroke="#ffd84d"
                strokeDasharray="1.1 0.45"
                strokeWidth="0.3"
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
              <circle cx={end.x} cy={end.y} fill="none" r="1.15" stroke="#42e8e0" strokeWidth="0.24" />
            </g>
          );
        })()}

        {layers.decisions && !frame.ball.flight && frame.actors
          .filter(actor => actor.intent?.kind === 'pass')
          .slice(0, 1)
          .map(actor => {
            const target = actor.intent?.targetPosition;
            if (!target) return null;
            const start = toView(actor.position);
            const end = toView(target);
            return (
              <line
                key={`decision-${formatId(actor.id)}`}
                markerEnd="url(#match-lab-arrow)"
                opacity="0.88"
                stroke="#ffd84d"
                strokeDasharray="1 0.5"
                strokeWidth="0.28"
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
            );
          })}

        {layers.pressure && frame.actors
          .filter(actor => actor.intent?.kind === 'press' || actor.intent?.kind === 'intercept')
          .slice(0, 1)
          .map(actor => {
            const target = actor.intent?.targetPosition;
            if (!target) return null;
            const start = toView(actor.position);
            const end = toView(target);
            return (
              <line
                key={`pressure-${formatId(actor.id)}`}
                markerEnd="url(#match-lab-arrow)"
                opacity="0.82"
                stroke="#ff596d"
                strokeDasharray="0.75 0.45"
                strokeWidth="0.3"
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
            );
          })}

        {layers.decisions && selectedActorId !== null && (() => {
          const actor = actors.get(selectedActorId);
          const target = actor?.intent?.targetPosition;
          if (!actor || !target || actor.intent?.kind !== 'referee_position') return null;
          const start = toView(actor.position);
          const end = toView(target);
          return (
            <line
              markerEnd="url(#match-lab-arrow)"
              opacity="0.78"
              stroke="#ddff3f"
              strokeDasharray="0.75 0.4"
              strokeWidth="0.26"
              x1={start.x}
              x2={end.x}
              y1={start.y}
              y2={end.y}
            />
          );
        })()}

        {frame.actors.map(actor => {
          const participant = participants.get(actor.id);
          if (!participant) return null;
          const position = toView(actor.position);
          const color = participantColor(participant, manifest);
          const selected = actor.id === selectedActorId;
          const speed = Math.hypot(actor.velocity.x, actor.velocity.y);
          const velocityScale = 0.75;
          const facingLength = 1.75;
          const isOfficial = participant.kind !== 'player';
          const isIntendedReceiver = frame.ball.flight?.intendedTargetActorId === actor.id;
          const isInterceptionActor = actor.intent?.kind === 'intercept';
          const isPressingActor = actor.intent?.kind === 'press';

          return (
            <g key={formatId(actor.id)}>
              {layers.motion && speed > 0.08 && (
                <line
                  markerEnd="url(#match-lab-arrow)"
                  opacity="0.82"
                  stroke={color}
                  strokeWidth="0.22"
                  x1={position.x}
                  x2={position.x + actor.velocity.x * velocityScale}
                  y1={position.y}
                  y2={position.y + actor.velocity.y * velocityScale}
                />
              )}
              {layers.motion && (
                <line
                  markerEnd="url(#match-lab-arrow)"
                  opacity="0.9"
                  stroke="#ffffff"
                  strokeWidth="0.18"
                  x1={position.x}
                  x2={position.x + Math.cos(actor.yaw) * facingLength}
                  y1={position.y}
                  y2={position.y + Math.sin(actor.yaw) * facingLength}
                />
              )}

              <g
                aria-label={actorLabel(participant, actor)}
                className="cursor-pointer outline-none"
                onClick={() => onSelectActor(actor.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectActor(actor.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {selected && (
                  <circle cx={position.x} cy={position.y} fill="none" r="1.55" stroke="#ffffff" strokeWidth="0.28" />
                )}
                {actor.hasPossession && (
                  <circle cx={position.x} cy={position.y} fill="none" r="1.35" stroke="#ffd84d" strokeWidth="0.34" />
                )}
                {layers.decisions && isIntendedReceiver && (
                  <circle cx={position.x} cy={position.y} fill="none" r="1.42" stroke="#42e8e0" strokeDasharray="0.7 0.4" strokeWidth="0.28" />
                )}
                {layers.pressure && (isInterceptionActor || isPressingActor) && (
                  <circle cx={position.x} cy={position.y} fill="none" r="1.48" stroke="#ff596d" strokeDasharray="0.55 0.35" strokeWidth="0.28" />
                )}
                {isOfficial ? (
                  <rect
                    fill={color}
                    height="1.55"
                    rx="0.22"
                    stroke="#06110c"
                    strokeWidth="0.22"
                    transform={`rotate(45 ${position.x} ${position.y})`}
                    width="1.55"
                    x={position.x - 0.775}
                    y={position.y - 0.775}
                  />
                ) : (
                  <circle cx={position.x} cy={position.y} fill={color} r="0.95" stroke="#06110c" strokeWidth="0.28" />
                )}
                {participant.kind === 'player' && (
                  <text
                    dominantBaseline="central"
                    fill="#071018"
                    fontSize="0.92"
                    fontWeight="800"
                    pointerEvents="none"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y + 0.03}
                  >
                    {participant.shirtNumber}
                  </text>
                )}
                {layers.labels && (
                  <text
                    fill="#ffffff"
                    fontSize="1.05"
                    fontWeight="700"
                    paintOrder="stroke"
                    pointerEvents="none"
                    stroke="rgba(3,8,5,0.9)"
                    strokeWidth="0.34"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y + 2.45}
                  >
                    {String(participant.role)}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {(() => {
          const ball = toView(frame.ball.position);
          const visualRadius = 0.42 + Math.min(frame.ball.position.z, 1.5) * 0.22;
          return (
            <g aria-label={`Ball height ${frame.ball.position.z.toFixed(2)} metres`}>
              <ellipse
                cx={ball.x + frame.ball.position.z * 0.38}
                cy={ball.y + frame.ball.position.z * 0.38}
                fill="rgba(0,0,0,0.62)"
                filter="url(#match-lab-ball-shadow)"
                rx={visualRadius * 1.08}
                ry={visualRadius * 0.55}
              />
              <circle cx={ball.x} cy={ball.y} fill="#ffffff" r={visualRadius} stroke="#101318" strokeWidth="0.16" />
              <circle cx={ball.x - visualRadius * 0.12} cy={ball.y - visualRadius * 0.1} fill="#101318" r={visualRadius * 0.22} />
              {frame.ball.state === 'contested' && (
                <>
                  <circle cx={ball.x} cy={ball.y} fill="none" r={visualRadius + 0.55} stroke="#ff596d" strokeWidth="0.22" />
                  <circle cx={ball.x} cy={ball.y} fill="none" r={visualRadius + 0.9} stroke="#42e8e0" strokeDasharray="0.45 0.35" strokeWidth="0.18" />
                </>
              )}
              {frame.ball.position.z > 0.115 && (
                <text fill="#ffffff" fontSize="1.05" fontWeight="700" x={ball.x + 0.85} y={ball.y - 0.7}>
                  {frame.ball.position.z.toFixed(2)}m
                </text>
              )}
            </g>
          );
        })()}

        <g aria-hidden="true">
          <rect fill="rgba(3,8,7,0.72)" height="4.2" rx="0.8" width="25" x={pitchX + 1.2} y={pitchY + 1.2} />
          <text fill="#dce9df" fontFamily="monospace" fontSize="1.35" x={pitchX + 2.4} y={pitchY + 3.85}>
            105 × 68m · 20Hz truth
          </text>
        </g>

        <g aria-hidden="true" transform={`translate(${pitchX + pitchLength - 29} ${pitchY + pitchWidth - 3.3})`}>
          <rect fill="rgba(3,8,7,0.74)" height="2.6" rx="0.6" width="27.8" x="0" y="0" />
          <circle cx="1.4" cy="1.3" fill="#ffd84d" r="0.34" />
          <text fill="#dce9df" fontSize="0.9" x="2.1" y="1.62">{activeFlightLabel}</text>
          <circle cx="7.4" cy="1.3" fill="#42e8e0" r="0.34" />
          <text fill="#dce9df" fontSize="0.9" x="8.1" y="1.62">RECEIVE</text>
          <circle cx="15.3" cy="1.3" fill="#ff596d" r="0.34" />
          <text fill="#dce9df" fontSize="0.9" x="16" y="1.62">PRESS</text>
          <circle cx="22.1" cy="1.3" fill="#ddff3f" r="0.34" />
          <text fill="#dce9df" fontSize="0.9" x="22.8" y="1.62">OFFICIAL</text>
        </g>
      </svg>
    </div>
  );
}
