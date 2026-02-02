# backend/services/mobilefacenet_model.py
import torch.nn as nn
import torch.nn.functional as F

# ---- Basic blocks ----
class ConvBlock(nn.Module):
    def __init__(self, inp, oup, k, s, p, groups=1, bn=True, relu=True):
        super().__init__()
        self.conv = nn.Conv2d(inp, oup, k, s, p, groups=groups, bias=False)
        self.bn = nn.BatchNorm2d(oup) if bn else nn.Identity()
        self.relu = nn.PReLU(oup) if relu else nn.Identity()

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))

class DepthWise(nn.Module):
    def __init__(self, inp, oup, stride):
        super().__init__()
        self.conv = nn.Sequential(
            ConvBlock(inp, inp, 3, stride, 1, groups=inp),
            ConvBlock(inp, oup, 1, 1, 0, relu=True),
        )

    def forward(self, x):
        return self.conv(x)

class Residual(nn.Module):
    def __init__(self, inp, oup, num_blocks, stride):
        super().__init__()
        layers = []
        layers.append(DepthWise(inp, oup, stride))
        for _ in range(num_blocks - 1):
            layers.append(DepthWise(oup, oup, 1))
        self.body = nn.Sequential(*layers)

    def forward(self, x):
        out = self.body(x)
        return out

# ---- MobileFaceNet ----
class MobileFaceNet(nn.Module):
    """
    Standard MobileFaceNet-style backbone.
    Input: 112x112 RGB
    Output: embedding_dim (default 128)
    """
    def __init__(self, embedding_dim=128):
        super().__init__()
        self.conv1 = ConvBlock(3, 64, 3, 2, 1)
        self.dw1   = ConvBlock(64, 64, 3, 1, 1, groups=64)

        self.stage1 = Residual(64, 64, num_blocks=4, stride=2)   # 56 -> 28
        self.stage2 = Residual(64, 128, num_blocks=6, stride=2)  # 28 -> 14
        self.stage3 = Residual(128, 128, num_blocks=2, stride=2) # 14 -> 7

        self.conv2 = ConvBlock(128, 512, 1, 1, 0)
        self.gdc   = nn.Conv2d(512, 512, kernel_size=7, stride=1, padding=0, groups=512, bias=False)
        self.bn_gdc = nn.BatchNorm2d(512)
        self.fc = nn.Linear(512, embedding_dim, bias=False)
        self.bn_fc = nn.BatchNorm1d(embedding_dim)

    def forward(self, x):
        x = self.conv1(x)
        x = self.dw1(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.conv2(x)
        x = self.gdc(x)
        x = self.bn_gdc(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        x = self.bn_fc(x)
        x = F.normalize(x, p=2, dim=1)
        return x
