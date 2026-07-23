package playground

import "testing"

func TestParseNonNegativeFeeRejectsNonFiniteValues(t *testing.T) {
	t.Parallel()

	for _, value := range []string{"", "invalid", "-1", "NaN", "+Inf", "-Inf", "1e999"} {
		value := value
		t.Run(value, func(t *testing.T) {
			t.Parallel()
			if got := parseNonNegativeFee(value); got != 0 {
				t.Fatalf("parseNonNegativeFee(%q) = %v, want 0", value, got)
			}
		})
	}

	if got := parseNonNegativeFee("0.025"); got != 0.025 {
		t.Fatalf("parseNonNegativeFee(valid) = %v, want 0.025", got)
	}
}
