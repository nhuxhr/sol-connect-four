export type SolConnectFour = {
  "version": "0.1.0",
  "name": "sol_connect_four",
  "instructions": [
    {
      "name": "newGame",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reference",
          "type": "publicKey"
        },
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinGame",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "play",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "opponent",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "col",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reference",
            "type": "publicKey"
          },
          {
            "name": "player0",
            "type": "publicKey"
          },
          {
            "name": "player1",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "board",
            "type": {
              "array": [
                {
                  "array": [
                    {
                      "option": "u8"
                    },
                    7
                  ]
                },
                6
              ]
            }
          },
          {
            "name": "state",
            "type": {
              "defined": "GameState"
            }
          },
          {
            "name": "prize",
            "type": "u64"
          },
          {
            "name": "turn",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotStarted"
          },
          {
            "name": "InProgress"
          },
          {
            "name": "Player0Won"
          },
          {
            "name": "Player1Won"
          },
          {
            "name": "Draw"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "GameFull",
      "msg": "Game is full"
    },
    {
      "code": 6001,
      "name": "InvalidPlayer",
      "msg": "Invalid player"
    },
    {
      "code": 6002,
      "name": "GameNotStarted",
      "msg": "Game not started"
    },
    {
      "code": 6003,
      "name": "GameInProgress",
      "msg": "Game in progress"
    },
    {
      "code": 6004,
      "name": "GameOver",
      "msg": "Game over"
    },
    {
      "code": 6005,
      "name": "NotYourTurn",
      "msg": "Not your turn"
    },
    {
      "code": 6006,
      "name": "InvalidRow",
      "msg": "Invalid row"
    },
    {
      "code": 6007,
      "name": "InvalidColumn",
      "msg": "Invalid column"
    },
    {
      "code": 6008,
      "name": "CellNotEmpty",
      "msg": "Cell is not empty"
    }
  ]
};

export const IDL: SolConnectFour = {
  "version": "0.1.0",
  "name": "sol_connect_four",
  "instructions": [
    {
      "name": "newGame",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "reference",
          "type": "publicKey"
        },
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinGame",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "play",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "opponent",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "game",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "col",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reference",
            "type": "publicKey"
          },
          {
            "name": "player0",
            "type": "publicKey"
          },
          {
            "name": "player1",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "board",
            "type": {
              "array": [
                {
                  "array": [
                    {
                      "option": "u8"
                    },
                    7
                  ]
                },
                6
              ]
            }
          },
          {
            "name": "state",
            "type": {
              "defined": "GameState"
            }
          },
          {
            "name": "prize",
            "type": "u64"
          },
          {
            "name": "turn",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GameState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotStarted"
          },
          {
            "name": "InProgress"
          },
          {
            "name": "Player0Won"
          },
          {
            "name": "Player1Won"
          },
          {
            "name": "Draw"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "GameFull",
      "msg": "Game is full"
    },
    {
      "code": 6001,
      "name": "InvalidPlayer",
      "msg": "Invalid player"
    },
    {
      "code": 6002,
      "name": "GameNotStarted",
      "msg": "Game not started"
    },
    {
      "code": 6003,
      "name": "GameInProgress",
      "msg": "Game in progress"
    },
    {
      "code": 6004,
      "name": "GameOver",
      "msg": "Game over"
    },
    {
      "code": 6005,
      "name": "NotYourTurn",
      "msg": "Not your turn"
    },
    {
      "code": 6006,
      "name": "InvalidRow",
      "msg": "Invalid row"
    },
    {
      "code": 6007,
      "name": "InvalidColumn",
      "msg": "Invalid column"
    },
    {
      "code": 6008,
      "name": "CellNotEmpty",
      "msg": "Cell is not empty"
    }
  ]
};
