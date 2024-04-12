from kb import KMKKeyboard
from kmk.keys import KC
from kmk.modules.layers import Layers

keyboard = KMKKeyboard()

# Now that the keyboard object is defined, append the Layers module.
keyboard.modules.append(Layers())
_______ = KC.TRNS
XXXXXXX = KC.NO
keyboard.keymap = [
    [
        KC.NLCK, KC.PSLS, KC.PAST, KC.PMNS,
        KC.P7,   KC.P8,   KC.P9,   KC.A,
        KC.P4,   KC.P5,   KC.P6,   KC.PPLS,
        KC.P1,   KC.P2,   KC.P3,   KC.SLSH,
        _______, KC.SPACE, XXXXXXX,   XXXXXXX,
        ],
    [
        KC.LALT(KC.A), KC.LALT(KC.B), KC.LALT(KC.C), KC.LALT(KC.D),
        KC.LALT(KC.W), KC.LALT(KC.F), KC.LALT(KC.G), KC.LALT(KC.H),
        KC.LALT(KC.M), KC.LALT(KC.V), KC.LALT(KC.O), KC.LALT(KC.P),
        KC.LALT(KC.Q), KC.LALT(KC.R), KC.LALT(KC.S), KC.LALT(KC.T),
        _______, KC.NO, XXXXXXX, XXXXXXX,
    ],
]

if __name__ == '__main__':
    keyboard.go()
