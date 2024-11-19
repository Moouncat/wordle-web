<script setup lang="ts">
import { onUnmounted, ref, computed } from 'vue'
import { getWord, allWords } from './words'
import Keyboard from './Keyboard.vue'
import { LetterState } from './types'

// Get word of the day
const answer = getWord()

// Board state. Each tile is represented as { letter, state, prefilled }
const board = ref(
  Array.from({ length: 6 }, (_, rowIndex) =>
    Array.from({ length: 5 }, (_, colIndex) => ({
      letter: '',
      state: LetterState.INITIAL,
      prefilled: false, // Indicates if the tile is currently prefilled
      wasPrefilled: false, // Tracks if the tile was ever prefilled
      modified: false,
    }))
  )
);


// Current active row and tile
let currentRowIndex = ref(0)
let currentTileIndex = ref(0)
const currentRow = computed(() => board.value[currentRowIndex.value])

// Feedback state: message and shake
let message = ref('')
let grid = ref('')
let shakeRowIndex = ref(-1)
let success = ref(false)

// Keep track of revealed letters for the virtual keyboard
const letterStates = ref<Record<string, LetterState>>({})

// Handle keyboard input
let allowInput = ref(true)

const onKeyup = (e: KeyboardEvent) => onKey(e.key)

window.addEventListener('keyup', onKeyup)

onUnmounted(() => {
  window.removeEventListener('keyup', onKeyup)
})

let clickCount = 0

const onTitleClick = () => {
  console.log("click")
  clickCount++
  if (clickCount === 3) {
    setTimeout(() => {
      clickCount = 0
    }, 1000)
  }
}

function onKey(key: string) {
  if (!allowInput.value) return
  if (key === 'Backspace' && clickCount === 3) {
    console.log("here")
    showMessage(`Debug: ${answer}`)
  }
  if (/^[a-zA-Z]$/.test(key)) {
    fillTile(key.toLowerCase())
  } else if (key === 'Backspace') {
    clearTile()
  } else if (key === 'Enter') {
    completeRow()
  }
}

function fillTile(letter: string) {
  const activeTile = currentRow.value[currentTileIndex.value];
  if (activeTile) {
    // Mark as modified if it was prefilled and now changed
    if (activeTile.prefilled || activeTile.wasPrefilled) {
      activeTile.modified = activeTile.letter !== letter;
    }

    activeTile.letter = letter;
    activeTile.prefilled = false; // Allow editing
    activeTile.wasPrefilled ||= true; // Keep tracking if it was prefilled

    if (currentTileIndex.value < currentRow.value.length - 1) {
      currentTileIndex.value++;
    }
  }
}


function clearTile() {
  const activeTile = currentRow.value[currentTileIndex.value];
  if (activeTile && activeTile.letter) {
    activeTile.letter = '';
    activeTile.modified = true; // Mark as modified
    activeTile.prefilled = false; // Allow clearing
  } else if (currentTileIndex.value > 0) {
    currentTileIndex.value--;
    const previousTile = currentRow.value[currentTileIndex.value];
    if (previousTile && previousTile.letter) {
      previousTile.letter = '';
      previousTile.modified = true; // Mark as modified
      previousTile.prefilled = false; // Allow clearing
    }
  }
}


function completeRow() {
  if (currentRow.value.every((tile) => tile.letter)) {
    const guess = currentRow.value.map((tile) => tile.letter).join('')
    if (!allWords.includes(guess) && guess !== answer) {
      shake()
      showMessage(`Nicht in der Wörterliste`)
      return
    }

    const answerLetters: (string | null)[] = answer.split('')
    const correctLetters: string[] = []

    // First pass: mark correct ones
    currentRow.value.forEach((tile, i) => {
      if (answerLetters[i] === tile.letter) {
        tile.state = letterStates.value[tile.letter] = LetterState.CORRECT
        answerLetters[i] = null
        correctLetters[i] = tile.letter
      } else {
        correctLetters[i] = ''
      }
    })

    // Second pass: mark present
    currentRow.value.forEach((tile) => {
      if (!tile.state && answerLetters.includes(tile.letter)) {
        tile.state = LetterState.PRESENT
        answerLetters[answerLetters.indexOf(tile.letter)] = null
        if (!letterStates.value[tile.letter]) {
          letterStates.value[tile.letter] = LetterState.PRESENT
        }
      }
    })

    // Third pass: mark absent
    currentRow.value.forEach((tile) => {
      if (!tile.state) {
        tile.state = LetterState.ABSENT
        if (!letterStates.value[tile.letter]) {
          letterStates.value[tile.letter] = LetterState.ABSENT
        }
      }
    })

    allowInput.value = false
    if (currentRow.value.every((tile) => tile.state === LetterState.CORRECT)) {
      // Win case
      setTimeout(() => {
        grid.value = genResultGrid()
        showMessage(
          ['Unglaublich!', 'Genial', 'Großartig', 'Super', 'Gut', 'Puh...'][
            currentRowIndex.value
          ],
          -1
        )
        success.value = true
      }, 1600)
    } else if (currentRowIndex.value < board.value.length - 1) {
      // Move to the next row after animation delay
      setTimeout(() => {
        currentRowIndex.value++
        currentTileIndex.value = 0
        const nextRow = board.value[currentRowIndex.value]
        correctLetters.forEach((letter, i) => {
          if (letter) {
            nextRow[i].letter = letter
            nextRow[i].prefilled = true // Mark as pre-filled but not "correct"
          }
        })

        allowInput.value = true
      }, 2000) // Match animation duration
    } else {
      // Game over
      setTimeout(() => {
        showMessage(answer.toUpperCase(), -1)
      }, 1600)
    }
  } else {
    shake()
    showMessage('Nicht genug Buchstaben')
  }
}

function showMessage(msg: string, time = 1000) {
  message.value = msg
  if (time > 0) {
    setTimeout(() => {
      message.value = ''
    }, time)
  }
}

function shake() {
  shakeRowIndex.value = currentRowIndex.value
  setTimeout(() => {
    shakeRowIndex.value = -1
  }, 1000)
}

const icons = {
  [LetterState.CORRECT]: '🟩',
  [LetterState.PRESENT]: '🟨',
  [LetterState.ABSENT]: '⬜',
  [LetterState.INITIAL]: null,
}

function genResultGrid() {
  return board.value
    .slice(0, currentRowIndex.value + 1)
    .map((row) => {
      return row.map((tile) => icons[tile.state]).join('')
    })
    .join('\n')
}

function onTileClick(index: number) {
  const rowIndex = Math.floor(index / 5);
  const colIndex = index % 5;

  if (rowIndex === currentRowIndex.value) {
    currentTileIndex.value = colIndex;

    // Clicking a tile should not immediately modify it
    const clickedTile = board.value[rowIndex][colIndex];
    if (clickedTile.prefilled) {
      clickedTile.wasPrefilled = true; // Retain prefilled tracking
    }
  }
}

function isActiveTile(rowIndex: number, colIndex: number) {
  return currentRowIndex.value === rowIndex && currentTileIndex.value === colIndex ? 'active' : ''
}

</script>

<template lang="pug">
  Transition
    div.message(v-if="message")
      | {{ message }}
      pre(v-if="grid") {{ grid }}
  header
    h1(@click="onTitleClick") WORDLE
  div#board
    div(v-for="(row, rowIndex) in board"
        :class=`[
          'row',
          shakeRowIndex === rowIndex && 'shake',
          success && currentRowIndex === rowIndex && 'jump'
        ]`)
      div(v-for="(tile, colIndex) in row"
          :class=`['tile', tile.letter && 'filled',
            tile.state && 'revealed',
            tile.prefilled && 'prefilled',
            tile.wasPrefilled && tile.modified &&'wasPrefilled',
            tile.modified && 'modified',
            isActiveTile(rowIndex, colIndex)]`
          @click="onTileClick(rowIndex * 5 + colIndex)"
        )
        div.front(:style="{ transitionDelay: `${colIndex * 300}ms` }")
          | {{ tile.letter }}
        div(:class="['back', tile.state]"
            :style="{ transitionDelay: `${colIndex * 300}ms`, animationDelay: `${colIndex * 100}ms` }")
          | {{ tile.letter }}
  Keyboard(@key="onKey" :letter-states="letterStates")
</template>

<style scoped>
#board {
  display: grid;
  grid-template-rows: repeat(6, 1fr);
  grid-gap: 5px;
  padding: 10px;
  box-sizing: border-box;
  --height: min(420px, calc(var(--vh, 100vh) - 310px));
  height: var(--height);
  width: min(350px, calc(var(--height) / 6 * 5));
  margin: 0px auto;
}
.message {
  position: absolute;
  left: 50%;
  top: 80px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.85);
  padding: 16px 20px;
  z-index: 2;
  border-radius: 4px;
  transform: translateX(-50%);
  transition: opacity 0.3s ease-out;
  font-weight: 600;
}
.message.v-leave-to {
  opacity: 0;
}
.row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 5px;
}
.tile {
  width: 100%;
  font-size: 2rem;
  line-height: 2rem;
  font-weight: bold;
  vertical-align: middle;
  text-transform: uppercase;
  user-select: none;
  position: relative;
}
.tile.filled {
  animation: zoom 0.2s;
}
.tile .front,
.tile .back {
  box-sizing: border-box;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.tile .front {
  border: 2px solid #023E7D;
}
.tile.filled .front {
  border-color: #0353A4;
  color: white;
}
.tile .back {
  transform: rotateX(180deg);
}
.tile.revealed .front {
  transform: rotateX(180deg);
}
.tile.revealed .back {
  transform: rotateX(0deg);
}
.tile.active {
  background-color: #001c42 !important;
}
.tile.prefilled {
  animation: fade-in 500ms ease-in;
  background-color: #7dd37590;
}
.tile.wasPrefilled {
  background-color: #7dd37590;
}
.tile.modified {
  background-color: initial;
}

@keyframes fade-in {
  from {
    background-color: rgba(255, 255, 255, 0);
  }
  to {
    background-color: #7dd37590;
}
}

@keyframes zoom {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0% {
    transform: translate(1px);
  }
  10% {
    transform: translate(-2px);
  }
  20% {
    transform: translate(2px);
  }
  30% {
    transform: translate(-2px);
  }
  40% {
    transform: translate(2px);
  }
  50% {
    transform: translate(-2px);
  }
  60% {
    transform: translate(2px);
  }
  70% {
    transform: translate(-2px);
  }
  80% {
    transform: translate(2px);
  }
  90% {
    transform: translate(-2px);
  }
  100% {
    transform: translate(1px);
  }
}

.jump .tile .back {
  animation: jump 0.5s;
}

@keyframes jump {
  0% {
    transform: translateY(0px);
  }
  20% {
    transform: translateY(5px);
  }
  60% {
    transform: translateY(-25px);
  }
  90% {
    transform: translateY(3px);
  }
  100% {
    transform: translateY(0px);
  }
}

@media (max-height: 680px) {
  .tile {
    font-size: 3vh;
  }
}
</style>
