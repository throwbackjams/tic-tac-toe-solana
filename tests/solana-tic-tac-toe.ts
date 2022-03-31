import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { expect } from "chai";
import { SolanaTicTacToe } from "../target/types/solana_tic_tac_toe";

describe("solana-tic-tac-toe", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTicTacToe as Program<SolanaTicTacToe>;

  async function play(program, game, player, tile, expectedTurn, expectedGameState, expectedBoard) {
    await program.rpc.play(tile, {
      accounts: {
        player: player.publicKey,
        game
      },
      signers: player instanceof (anchor.Wallet as any) ? [] : [player]
    });

    const gameState = await program.account.game.fetch(game);
    expect(gameState.turn).to.equal(expectedTurn);
    expect(gameState.state).to.eql(expectedGameState);
    expect(gameState.board).to.eql(expectedBoard);
  }

  it('setup game!', async() => {
    const gameKeypair = anchor.web3.Keypair.generate();
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();
    await program.rpc.setupGame(playerTwo.publicKey, {
      accounts: {
        game: gameKeypair.publicKey,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      },
      signers: [gameKeypair]
    });

    let gameState = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players)
      .to
      .eql([playerOne.publicKey, playerTwo.publicKey]);
    expect(gameState.state).to.eql({ active: {}});
    expect(gameState.board)
      .to
      .eql([[null,null,null],[null,null,null],[null,null,null]]);
  });

  it('player one plays invalid move', async() => {
    const gameKeypair = anchor.web3.Keypair.generate();
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();

    await program.rpc.setupGame(playerTwo.publicKey, {
      accounts: {
        game: gameKeypair.publicKey,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      },
      signers: [gameKeypair]
    });

    let gameState = await program.account.game.fetch(gameKeypair.publicKey);

    try {
      await play(
        program,
        gameKeypair.publicKey,
        playerOne,
        {row: 5, column: 1}, // ERROR: out of bounds row
        4,
        { active: {}, },
        [
          [{x:{}},{x: {}},null],
          [{o:{}},null,null],
          [null,null,null]
        ]
      );
      // we use this to make sure we definitely throw an error
      chai.assert(false, "should've failed but didn't ");
    } catch (_err) {
        expect(_err).to.be.instanceOf(AnchorError);
        const err: AnchorError = _err;
        expect(err.error.errorCode.number).to.equal(6003);
    }
  
  });


  it('player one plays valid move', async() => {
    const gameKeypair = anchor.web3.Keypair.generate();
    const playerOne = program.provider.wallet;
    const playerTwo = anchor.web3.Keypair.generate();

    await program.rpc.setupGame(playerTwo.publicKey, {
      accounts: {
        game: gameKeypair.publicKey,
        playerOne: playerOne.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      },
      signers: [gameKeypair]
    });

    let gameState = await program.account.game.fetch(gameKeypair.publicKey);
    expect(gameState.turn).to.equal(1);
    expect(gameState.players)
      .to
      .eql([playerOne.publicKey, playerTwo.publicKey]);
    expect(gameState.state).to.eql({ active: {} });
    expect(gameState.board).to.eql([[null,null,null],[null,null,null],[null,null,null]]);

    await play(
      program,
      gameKeypair.publicKey,
      playerOne,
      {row: 0, column: 0},
      2,
      { active: {}, },
      [
        [{x:{}},null,null],
        [null,null,null],
        [null,null,null]
      ]
    );
  
  });


});
