import { Room, Client } from "colyseus";
import {
  Clothing,
  InputData,
  Message,
  MyRoomState,
  Player,
  Trade,
} from "./RoomState";
import { IncomingMessage } from "http";
import { Bumpkin } from "../types/bumpkin";

const MAX_MESSAGES = 100;

export class TestRoom extends Room<MyRoomState> {
  fixedTimeStep = 1000 / 60;

  maxClients: number = 150;

  private pushMessage = (message: Message) => {
    this.state.messages.push(message);

    while (this.state.messages.length > MAX_MESSAGES) {
      this.state.messages.shift();
    }
  };

  private pushTrade = (trade: Trade) => {
    this.state.trades.push(trade);

    while (this.state.trades.length > MAX_MESSAGES) {
      this.state.trades.shift();
    }
  };

  // Farm ID > sessionId
  private farmConnections: Record<number, string> = {};

  onCreate(options: any) {
    this.setState(new MyRoomState());

    // set map dimensions
    (this.state.mapWidth = 600), (this.state.mapHeight = 600);

    this.onMessage(0, (client, input) => {
      // handle player input
      const player = this.state.players.get(client.sessionId);

      // enqueue input to user input buffer.
      player?.inputQueue.push(input);
    });

    let elapsedTime = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;

      while (elapsedTime >= this.fixedTimeStep) {
        elapsedTime -= this.fixedTimeStep;
        this.fixedTick(this.fixedTimeStep);
      }
    });

    const message = new Message();
    message.text = `Welcome to ${this.roomName.replace("_", " ")}.`;
    message.sentAt = Date.now();
    this.pushMessage(message);
  }

  fixedTick(timeStep: number) {
    const velocity = 1.68;

    this.state.players.forEach((player, key) => {
      let input: InputData | undefined;

      // dequeue player inputs.
      while ((input = player.inputQueue.shift())) {
        if (input.x || input.y) {
          player.x = input.x;
          player.y = input.y;
        }

        if (input.sceneId) {
          player.sceneId = input.sceneId;
        }

        if (input.clothing) {
          player.clothing = new Clothing({
            body: input.clothing.body,
            shirt: input.clothing.shirt,
            pants: input.clothing.pants,
            onesie: input.clothing.onesie,
            wings: input.clothing.wings,
            suit: input.clothing.suit,
            dress: input.clothing.dress,
            hat: input.clothing.hat,
            hair: input.clothing.hair,
            updatedAt: Date.now(),
          });
        }

        player.tick = input.tick;

        if (input.text) {
          const message = new Message();
          message.sceneId = player.sceneId;
          message.text = input.text;
          message.sessionId = key;
          message.farmId = player.farmId;
          message.sentAt = Date.now();
          this.pushMessage(message);
        }

        if (input.trade) {
          const trade = new Trade();
          trade.sceneId = player.sceneId;
          trade.tradeId = input.trade.tradeId;
          trade.text = "Trade bought";
          trade.buyerId = input.trade.buyerId;
          trade.sellerId = input.trade.sellerId;
          trade.boughtAt = Date.now();
          this.pushTrade(trade);
        }
      }
    });
  }

  async onAuth(
    client: Client<any>,
    options: {
      jwt: string;
      farmId: number;
      bumpkin: Bumpkin;
      sceneId: string;
      experience: number;
    },
    request?: IncomingMessage | undefined
  ) {
    return {
      bumpkin: options.bumpkin,
      farmId: options.farmId,
      sceneId: options.sceneId,
      experience: options.experience,
    };

    // console.log("Try auth plaza", { options });
    // if (!options.jwt || !options.farmId) return false;

    // const jwt = await verifyRawJwt(options.jwt);

    // if (!jwt.userAccess.verified) return false;

    // const farm = await loadFarm(options.farmId);

    // if (!farm || farm.updatedBy !== jwt.address) {
    //   throw new Error("Not your farm");
    // }

    // return {
    //   bumpkin: farm.gameState.bumpkin,
    //   farmId: options.farmId,
    // };
  }

  onJoin(
    client: Client,
    options: { x: number; y: number },
    auth: {
      bumpkin: Bumpkin;
      farmId: number;
      sceneId: string;
      experience: number;
    }
  ) {
    //
    const previousConnection = this.farmConnections[auth.farmId];
    if (previousConnection) {
      // this.state.players.delete(previousConnection);
      const client = this.clients.find(
        (client) => client.sessionId === previousConnection
      );

      if (
        client &&
        this.state.players.get(client.sessionId)?.sceneId === "corn_maze"
      ) {
        throw new Error("You are already connected");
      }

      client?.leave();
    }

    this.farmConnections[auth.farmId] = client.sessionId;

    const player = new Player();
    player.x = options.x ?? 560; // Math.random() * this.state.mapWidth;
    player.y = options.y ?? 300; //Math.random() * this.state.mapHeight;
    player.farmId = auth.farmId;
    player.experience = auth.experience ?? 0;

    const clothing = auth.bumpkin.equipped;
    player.clothing.body = clothing.body;
    player.clothing.shirt = clothing.shirt;
    player.clothing.pants = clothing.pants;
    player.clothing.onesie = clothing.onesie;
    player.clothing.suit = clothing.suit;
    player.clothing.dress = clothing.dress;
    player.clothing.hat = clothing.hat;
    player.clothing.hair = clothing.hair;
    player.clothing.wings = clothing.wings;

    player.sceneId = auth.sceneId;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
