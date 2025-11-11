from __future__ import annotations

from rest_framework import serializers


class StatsResponseSerializer(serializers.Serializer):
    totals = serializers.DictField()
    by_year = serializers.DictField()
    by_type = serializers.DictField()
    by_language = serializers.DictField()

