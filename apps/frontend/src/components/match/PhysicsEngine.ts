import Matter from 'matter-js';
import * as PIXI from 'pixi.js';

export class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private app: PIXI.Application;
  private graphics: PIXI.Graphics;

  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = 0;
    this.app = new PIXI.Application({
      width: 1050,
      height: 680,
      backgroundColor: 0x2e7d32,
      antialias: true,
    });
    this.graphics = new PIXI.Graphics();
  }

  public init(container: HTMLElement) {
    const canvas = this.app.view as HTMLCanvasElement;
    // Scale the canvas to fit the container width
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    this.app.stage.addChild(this.graphics);
    this.createPitchBoundaries();
    Matter.Engine.run(this.engine);
    this.app.ticker.add(() => this.update());
  }

  private createPitchBoundaries() {
    const thickness = 10;
    const width = 1050;
    const height = 680;
    const options = { isStatic: true };

    Matter.Composite.add(this.world, [
      Matter.Bodies.rectangle(width / 2, -thickness / 2, width, thickness, options),
      Matter.Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, options),
      Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height, options),
      Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, options),
    ]);
  }

  private update() {
    this.graphics.clear();
    
    // Draw Pitch Lines
    this.graphics.lineStyle(2, 0xffffff, 0.3);
    this.graphics.drawRect(0, 0, 1050, 680);
    this.graphics.moveTo(525, 0);
    this.graphics.lineTo(525, 680);
    this.graphics.drawCircle(525, 340, 91.5);
    
    // Penalty areas
    this.graphics.drawRect(0, 138, 165, 404);
    this.graphics.drawRect(885, 138, 165, 404);

    const bodies = Matter.Composite.allBodies(this.world);
    for (const body of bodies) {
      if (body.isStatic) continue;
      
      const color = (body as any).renderColor || 0xffffff;
      const radius = (body as any).circleRadius;
      
      if (radius) {
        // Draw Shadow
        this.graphics.beginFill(0x000000, 0.2);
        this.graphics.drawCircle(body.position.x + 2, body.position.y + 2, radius);
        this.graphics.endFill();

        // Draw Body
        this.graphics.beginFill(color);
        this.graphics.lineStyle(2, 0xffffff, 0.5);
        this.graphics.drawCircle(body.position.x, body.position.y, radius);
        this.graphics.endFill();
      }
    }
  }

  public addBall(x: number, y: number) {
    const ball = Matter.Bodies.circle(x, y, 6, {
      frictionAir: 0.01,
      restitution: 0.8,
      density: 0.001,
    });
    (ball as any).renderColor = 0xffffff;
    Matter.Composite.add(this.world, ball);
    return ball;
  }

  public addPlayer(x: number, y: number, color: number = 0xffffff) {
    const player = Matter.Bodies.circle(x, y, 12, {
      frictionAir: 0.05,
      density: 0.002,
    });
    (player as any).renderColor = color;
    Matter.Composite.add(this.world, player);
    return player;
  }
  
  public destroy() {
    Matter.Engine.clear(this.engine);
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
}
