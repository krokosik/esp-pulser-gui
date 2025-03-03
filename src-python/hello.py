# %%
import numpy as np
import xarray as xr
import hvplot.xarray  # noqa
from pathlib import Path
import xrft
import xrscipy.signal.extra as dsp_extra

heartbeat_data_path = Path("../src-tauri/heartbeat_data.dat")
# %%
data = np.loadtxt(heartbeat_data_path)
da = xr.DataArray(
    data,
    dims=["time", "sig"],
    coords={
        "sig": ["raw", "processed", "BPM", "IBI"],
        "time": np.arange(data.shape[0]) * 25e-3,
    },
    name="heart_data",
)

da.sel(sig="processed").hvplot.line()
# %%
dsp_extra.highpass(da.sel(sig="raw"), f_cutoff=0.001, order=4).hvplot.line(
    xlim=(210, 220)
)
# %%
da.sel(sig="processed", time=np.s_[210: 220]).hvplot.line()
# %%
np.abs(xrft.fft(da.sel(sig="raw", time=np.s_[210: 220])).rename("fft")).hvplot.line()