import prompt from "prompt-sync"
const NUM_GENERATIONS = 30
const POPULATION_SIZE = 30
//Aqui é onde o usuário digita a dimensão, por exemplo, se digitar 8, a dimensão será 8 x 8, 
//se digitar 5, a dimensão será 5 x 5, se digitar 16, será 16 x 16 e assim por diante
const TABLE_SIZE = parseInt(prompt()('Informe a dimensão:'));

//Gerar os números de forma aleatória
const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const range = (ini: number, end: number) => Array(end - ini).fill(null).map((_, i) => i + ini)

const createTable = (rows = TABLE_SIZE, columns = TABLE_SIZE, zeros=true): number[][] => {
  if (zeros) {
    return (new Array(rows)).fill(new Array(columns).fill(0))
  } else {
    return new Array(rows).fill(0).map(() => (new Array(columns).fill(0).map(() => random(0, 10))))
  }
}

//Onde obtém-se a última jogada
const getLastGame = (games: Game[]) => {
  return games[games.length - 1]
}

//O jogo propiamente dito e suas respectivas funções
class Game {
  priority_table = createTable(TABLE_SIZE, TABLE_SIZE, false)
  moves: number = 0
  path: [number, number][] = []
  table: number[][] = createTable()
  position: [number, number] = [0,0]

  constructor() {
    this.setDefault()
  }

  setDefault() {
    this.moves = 0
    this.path = []
    this.table = createTable()
    this.position = [0,0]
    this.table[0][0] = 1
  }

  nextMoves() {
    const moves: [number, number][] = []
    const knight_moves = [[2, -1], [2, 1], [-2, -1], [-2, 1], [-1, -1], [-1, 2], [1, -2], [1, 2]]
    const [x, y] = this.position

    for (const [dx, dy] of knight_moves) {
      if (x + dx < 0 || dy < 0) continue

      try {
        if (this.table[x+dx][y+dy] == 0) {
          moves.push([x+dx, y+dy])
        }
      } catch (e) {}
    }

    return moves
  }

  getBestMove(moves: [number, number][]) {
    let bestValue = Number.NEGATIVE_INFINITY
    let bestMove = this.position

    for (const [x, y] of moves) {
      if (this.priority_table[x][y] > bestValue) {
        bestValue = this.priority_table[x][y]
        bestMove = [x,y]
      }
    }

    return  bestMove
  }

  moveTo(position: [number, number]) {
    const [x,y] = position
    this.path.push(position)
    this.position = position
    this.moves += 1
    this.table[x][y] = this.moves + 1
  }

  play() {
    this.setDefault()
    while (this.nextMoves().length) {
      const moves = this.nextMoves()
      const bestMove = this.getBestMove(moves)
      this.moveTo(bestMove)
    }
  }

  mutation() {
    const x = random(0, TABLE_SIZE-1)
    const y = random(0, TABLE_SIZE-1)
    this.priority_table[x][y] = random(0, 10)
    this.play()
  }

  printTable() {
    for (const i of range(0, TABLE_SIZE)) {
      let listNumber: string[] = []
      for (const j of range(0, TABLE_SIZE)) {
        listNumber.push(this.table[i][j].toString().padEnd(3))
      }
      console.log(listNumber.join(' '))
    }
  }

  printPriorityTable() {
    for (const i of range(0, TABLE_SIZE)) {
      let listNumber: string[] = []
      for (const j of range(0, TABLE_SIZE)) {
        listNumber.push(this.priority_table[i][j].toString().padEnd(3))
      }
      console.log(listNumber.join(' '))
    }
  }

  add(game: Game) {
    const g: Game = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
    for (const i of range(0, Math.floor(TABLE_SIZE/2))) {
      for (const j of range(0, TABLE_SIZE)) {
        g.priority_table[i][j] = game.priority_table[i][j]
      }
    }
    g.play()
    return g
  }
}

//Primeiro passo do algoritmo genético: Criar uma população genêsis(população inicial)
class Population {
  games: Game[] = []
  bestGames: Game[] = []
  worstGames: Game[] = []

  constructor() {
    for (const i of range(0, POPULATION_SIZE)) {
      const g = new Game()
      this.games.push(g)
    }
  }

  play() {
    for (const game of this.games) game.play()

    this.bestGames.push(this.getBestGame())
    this.worstGames.push(this.getWorstGame())

    console.log(`(${getLastGame(this.bestGames).moves}, ${getLastGame(this.worstGames).moves})`)
  }

  getBestGame() {
    let bestGame = this.games[0]
    for (const game of this.games) {
      if (game.moves > bestGame.moves) {
        bestGame = game
      }
    }
    return bestGame
  }

  getWorstGame() {
    let worstGame = this.games[0]
    for (const game of this.games) {
      if (game.moves < worstGame.moves) {
        worstGame = game
      }
    }

    return worstGame
  }

  nextGeneration() {
    const new_generation: Game[] = []
    for (const i of range(0, POPULATION_SIZE)) {
      const x = random(0, POPULATION_SIZE - 1)
      const y = random(0, POPULATION_SIZE - 1)

      new_generation.push(this.games[x].add(this.games[y]))
      new_generation.push(this.games[y].add(this.games[x]))

      getLastGame(new_generation).mutation()
    }

    this.games = new_generation
    this.games[0] = getLastGame(this.bestGames)
  }
}

const main = () => {
  console.time('time')

  const p = new Population()

  for (const i of range(0, NUM_GENERATIONS)) {
    p.play()
    p.nextGeneration()
  }

  const x = range(0, NUM_GENERATIONS)
  const y: number[] = []
  const z: number[] = []

  for (const game of p.bestGames) {
    y.push(game.moves)
  }

  for (const game of p.worstGames) {
    z.push(game.moves)
  }

  console.timeEnd('time')

  console.log('Generations', x)
  console.log('Best Game', y)
  console.log('Worst Game', z)

  const bestGame = getLastGame(p.bestGames)
  console.log('Priority Table')
  bestGame.printPriorityTable()
  console.log('Table')
  bestGame.printTable()
}

main()

