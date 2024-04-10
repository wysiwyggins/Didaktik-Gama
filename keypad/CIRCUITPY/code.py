from kb import KMKKeyboard
from kmk.keys import KC
from kmk.modules.layers import Layers

keyboard = KMKKeyboard()

# Now that the keyboard object is defined, append the Layers module.
keyboard.modules.append(Layers())

keyboard.keymap = [
    [
        KC.LALT(KC.A), KC.LALT(KC.B), KC.LALT(KC.C), KC.LALT(KC.D),
        KC.LALT(KC.E), KC.LALT(KC.F), KC.LALT(KC.G), KC.LALT(KC.H),
        KC.LALT(KC.M), KC.LALT(KC.N), KC.LALT(KC.O), KC.LALT(KC.P),
        KC.LALT(KC.Q), KC.LALT(KC.R), KC.LALT(KC.S), KC.LALT(KC.T),
        KC.NO, KC.TO(1), KC.NO, KC.NO,
    ],
    [
        KC.LCTRL(KC.A), KC.LCTRL(KC.B), KC.LCTRL(KC.C), KC.LCTRL(KC.D),
        KC.LCTRL(KC.E), KC.LCTRL(KC.F), KC.LCTRL(KC.G), KC.LCTRL(KC.H),
        KC.LCTRL(KC.M), KC.LCTRL(KC.N), KC.LCTRL(KC.O), KC.LCTRL(KC.P),
        KC.LCTRL(KC.Q), KC.LCTRL(KC.R), KC.LCTRL(KC.S), KC.LCTRL(KC.T),
        KC.NO, KC.TO(0), KC.NO, KC.NO,
    ],
]

if __name__ == '__main__':
    keyboard.go()
