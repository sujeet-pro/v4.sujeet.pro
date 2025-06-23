---
description: Sample Description
publishedOn: 2025-01-01
lastUpdatedOn: 2025-06-22
isDraft: true
tags: ["ai", "ml", "python"]
---

# Nested Test blog

This is a test blog post in a nested directory to verify that the blog page generation works with nested structures.

## AI and Machine Learning

This post focuses on AI and Machine Learning topics, demonstrating how tags work across different categories.

### Key Points

- **Artificial Intelligence**: Exploring the latest developments
- **Machine Learning**: Practical applications and techniques
- **Python**: The primary language for ML development

## Code Example

```python
import numpy as np
import pandas as pd

def train_model(X, y):
    # Simple linear regression
    X_with_bias = np.column_stack([np.ones(X.shape[0]), X])
    theta = np.linalg.inv(X_with_bias.T @ X_with_bias) @ X_with_bias.T @ y
    return theta
```

## Conclusion

This nested blog post shows that the system handles directory structures correctly while maintaining tag functionality.
