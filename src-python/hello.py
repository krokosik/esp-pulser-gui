# %%
import numpy as np
import xarray as xr
import hvplot.xarray  # noqa
from pathlib import Path
import xrft
import xrscipy.signal.extra as dsp_extra
from scipy.signal import butter, lfilter
import matplotlib.pyplot as plt

heartbeat_data_path = Path("../src-tauri/heartbeat_data.dat")
# %%
data = np.loadtxt(heartbeat_data_path)
da = xr.DataArray(
    data,
    dims=["time", "sig"],
    coords={
        "sig": ["raw", "processed", "BPM", "IBI"],
        "time": np.arange(data.shape[0]) * 40e-3,
    },
    name="heart_data",
)
sampling_rate = 25  # Hz
nyq = sampling_rate / 2

da.sel(sig="raw").hvplot.line()
# %%
dsp_extra.highpass(da.sel(sig="raw"), f_cutoff=0.001 / nyq, order=1).sel(
    time=np.s_[210:220]
).hvplot.line()
# %%
da.sel(sig="raw", time=np.s_[210:220]).hvplot.line()
# %%
np.abs(xrft.fft(da.sel(sig="raw", time=np.s_[210:220])).rename("fft")).hvplot.line()


# %%
n = 5168
data = da.sel(sig="raw").isel(time=slice(n, n + 200))
cut_off = 0# np.argwhere(np.abs(np.diff(data)) > 100_000)[-1][0] + 50
cut_data = data.copy()
cut_data[:cut_off] = 0
# cut_data[cut_off:] -= cut_data[cut_off:].mean()

# plt.plot(cut_data, label="Mean")
# Use polyfit to get the linear trend
x = np.arange(len(cut_data[cut_off:]))
z = np.polyfit(x, cut_data[cut_off:], 1)
p = np.poly1d(z)
# Remove the linear trend
cut_data[cut_off:] = cut_data[cut_off:] - p(x)
plt.plot(cut_data, label="Regression")
plt.legend()
